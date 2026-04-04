import { randomUUID } from 'node:crypto';
import { getPool } from '../db/postgres.js';
import { config } from '../config.js';
import {
  CUA_ORCHESTRATION_QUICKSTART_TEXT,
  CUA_ORCHESTRATION_QUICKSTART_TITLE,
  CUA_ORCHESTRATION_QUICKSTART_URI,
} from '../resources/cuaDelegationGuide.js';

export type OrchestrationPatternRecord = {
  id: string;
  userId: string;
  name: string;
  summary: string | null;
  urls: string[];
  stepsMarkdown: string;
  knownIssuesMarkdown: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertOrchestrationPatternInput = {
  patternId?: string;
  name: string;
  summary?: string;
  urls?: string[];
  stepsMarkdown: string;
  knownIssuesMarkdown?: string;
};

const inMemoryPatterns = new Map<string, OrchestrationPatternRecord[]>();

function normalizeString(value: unknown): string {
  return String(value || '').trim();
}

function normalizeUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .slice(0, 50);
}

function serializeRow(row: any): OrchestrationPatternRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    summary: row.summary ? String(row.summary) : null,
    urls: Array.isArray(row.urls_json) ? row.urls_json.map((entry: unknown) => String(entry || '').trim()).filter(Boolean) : [],
    stepsMarkdown: String(row.steps_markdown || ''),
    knownIssuesMarkdown: row.known_issues_markdown ? String(row.known_issues_markdown) : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listOrchestrationPatterns(userId: string): Promise<OrchestrationPatternRecord[]> {
  if (config.persistence !== 'postgres') {
    return [...(inMemoryPatterns.get(userId) || [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const db = getPool();
  const res = await db.query(
    `
    SELECT id, user_id, name, summary, urls_json, steps_markdown, known_issues_markdown, created_at, updated_at
    FROM user_orchestration_patterns
    WHERE user_id = $1
    ORDER BY updated_at DESC, created_at DESC
    `,
    [userId],
  );

  return res.rows.map(serializeRow);
}

export async function upsertOrchestrationPattern(
  userId: string,
  input: UpsertOrchestrationPatternInput,
): Promise<OrchestrationPatternRecord> {
  const name = normalizeString(input.name);
  const stepsMarkdown = normalizeString(input.stepsMarkdown);
  if (!name) throw new Error('Pattern name is required');
  if (!stepsMarkdown) throw new Error('stepsMarkdown is required');

  const summary = normalizeString(input.summary) || null;
  const urls = normalizeUrls(input.urls);
  const knownIssuesMarkdown = normalizeString(input.knownIssuesMarkdown) || null;

  if (config.persistence !== 'postgres') {
    const current = inMemoryPatterns.get(userId) || [];
    const now = new Date().toISOString();
    const patternId = normalizeString(input.patternId) || randomUUID();
    const next: OrchestrationPatternRecord = {
      id: patternId,
      userId,
      name,
      summary,
      urls,
      stepsMarkdown,
      knownIssuesMarkdown,
      createdAt: current.find((entry) => entry.id === patternId)?.createdAt || now,
      updatedAt: now,
    };
    const filtered = current.filter((entry) => entry.id !== patternId);
    filtered.unshift(next);
    inMemoryPatterns.set(userId, filtered);
    return next;
  }

  const db = getPool();
  const patternId = normalizeString(input.patternId);
  if (patternId) {
    const updated = await db.query(
      `
      UPDATE user_orchestration_patterns
      SET name = $3,
          summary = $4,
          urls_json = $5::jsonb,
          steps_markdown = $6,
          known_issues_markdown = $7,
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, name, summary, urls_json, steps_markdown, known_issues_markdown, created_at, updated_at
      `,
      [patternId, userId, name, summary, JSON.stringify(urls), stepsMarkdown, knownIssuesMarkdown],
    );
    if ((updated.rowCount ?? 0) > 0) {
      return serializeRow(updated.rows[0]);
    }
  }

  const created = await db.query(
    `
    INSERT INTO user_orchestration_patterns (
      id, user_id, name, summary, urls_json, steps_markdown, known_issues_markdown, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW(), NOW())
    RETURNING id, user_id, name, summary, urls_json, steps_markdown, known_issues_markdown, created_at, updated_at
    `,
    [randomUUID(), userId, name, summary, JSON.stringify(urls), stepsMarkdown, knownIssuesMarkdown],
  );

  return serializeRow(created.rows[0]);
}

export async function deleteOrchestrationPattern(userId: string, patternId: string): Promise<boolean> {
  const id = normalizeString(patternId);
  if (!id) return false;

  if (config.persistence !== 'postgres') {
    const current = inMemoryPatterns.get(userId) || [];
    const next = current.filter((entry) => entry.id !== id);
    inMemoryPatterns.set(userId, next);
    return next.length !== current.length;
  }

  const db = getPool();
  const res = await db.query('DELETE FROM user_orchestration_patterns WHERE id = $1 AND user_id = $2', [id, userId]);
  return (res.rowCount ?? 0) > 0;
}

function formatPattern(pattern: OrchestrationPatternRecord, index: number): string {
  const lines: string[] = [];
  lines.push(`### ${index + 1}. ${pattern.name}`);
  if (pattern.summary) {
    lines.push('');
    lines.push(pattern.summary);
  }
  if (pattern.urls.length) {
    lines.push('');
    lines.push('Known URLs / paths:');
    for (const url of pattern.urls) {
      lines.push(`- ${url}`);
    }
  }
  lines.push('');
  lines.push('Stepwise guide:');
  lines.push(pattern.stepsMarkdown);
  if (pattern.knownIssuesMarkdown) {
    lines.push('');
    lines.push('Known issues / steering conditions:');
    lines.push(pattern.knownIssuesMarkdown);
  }
  return lines.join('\n');
}

export async function buildUserScopedOrchestrationGuide(userId: string): Promise<{
  uri: string;
  title: string;
  text: string;
  patterns: OrchestrationPatternRecord[];
}> {
  const patterns = await listOrchestrationPatterns(userId);
  const sections: string[] = [CUA_ORCHESTRATION_QUICKSTART_TEXT];

  sections.push('\n## Pattern Memory Loop\n');
  sections.push('Before delegation, check whether the user already has known CUA patterns that fit the task. If so, prefer those patterns over improvising. After a successful or partially successful run, update or create a pattern before returning your final response so the next run starts with better context.');
  sections.push('\nPattern fields to maintain:\n- Name\n- Known URLs / paths\n- Stepwise guide for successful execution\n- Known issues / steering / clarification conditions\n');
  sections.push('If the MCP client supports skills or persistent instructions, keep those in sync as a secondary layer. The backend pattern library is the canonical cross-client context store for this user.');

  sections.push('\n## User Pattern Library\n');
  if (!patterns.length) {
    sections.push('No saved orchestration patterns yet. If this run discovers a reusable workflow, write one before finalizing your response.');
  } else {
    sections.push('Use these learned patterns as high-priority context before delegating to CUA. Update them when the user changes preferences or a run reveals a better path.');
    for (const [index, pattern] of patterns.entries()) {
      sections.push('');
      sections.push(formatPattern(pattern, index));
    }
  }

  return {
    uri: CUA_ORCHESTRATION_QUICKSTART_URI,
    title: CUA_ORCHESTRATION_QUICKSTART_TITLE,
    text: sections.join('\n'),
    patterns,
  };
}
