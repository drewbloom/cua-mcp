import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const target = path.join(process.cwd(), 'node_modules', '@langchain', 'langgraph-cua', 'dist', 'nodes', 'call-model.js');

async function patchFile() {
  let content;
  try {
    content = await readFile(target, 'utf8');
  } catch (error) {
    console.warn('[patch-langgraph-cua] target file not found, skipping:', target);
    return;
  }

  const broken = `\t}).bindTools([{\n\t\ttype: "computer_use_preview",\n\t\tdisplay_width: DEFAULT_DISPLAY_WIDTH,\n\t\tdisplay_height: DEFAULT_DISPLAY_HEIGHT,\n\t\tenvironment: _getOpenAIEnvFromStateEnv(configuration.environment)\n\t}]).bind({\n\t\ttruncation: "auto",\n\t\tprevious_response_id: previousResponseId\n\t});`;

  const fixed = `\t}).bindTools([{\n\t\ttype: "computer_use_preview",\n\t\tdisplay_width: DEFAULT_DISPLAY_WIDTH,\n\t\tdisplay_height: DEFAULT_DISPLAY_HEIGHT,\n\t\tenvironment: _getOpenAIEnvFromStateEnv(configuration.environment)\n\t}], {\n\t\ttruncation: "auto",\n\t\tprevious_response_id: previousResponseId\n\t});`;

  let patched = content;

  if (content.includes(broken)) {
    patched = patched.replace(broken, fixed);
  } else if (!content.includes(fixed)) {
    console.warn('[patch-langgraph-cua] expected snippet not found; no changes applied');
    return;
  }

  // Allow model override via env instead of hardcoding computer-use-preview.
  patched = patched.replace(
    'model: "computer-use-preview",',
    'model: process.env.CUA_MODEL || "computer-use-preview",',
  );

  if (patched === content) {
    console.log('[patch-langgraph-cua] already patched');
    return;
  }

  await writeFile(target, patched, 'utf8');
  console.log('[patch-langgraph-cua] patched', target);
}

patchFile().catch((error) => {
  console.error('[patch-langgraph-cua] failed:', error);
  process.exit(1);
});
