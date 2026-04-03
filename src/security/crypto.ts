import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function isSameHash(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function requireHex32ByteKey(raw: string, fieldName: string): Buffer {
  const value = String(raw || '').trim();
  if (!/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(`${fieldName} must be a 64-char hex string.`);
  }
  return Buffer.from(value, 'hex');
}

export function encryptText(plaintext: string, key: Buffer): { ciphertext: string; ivHex: string; authTagHex: string; keyVersion: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    keyVersion: 'v1',
  };
}

export function decryptText(ciphertext: string, ivHex: string, authTagHex: string, key: Buffer): string {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}