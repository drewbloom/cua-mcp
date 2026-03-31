import { randomBytes } from 'node:crypto';

const key = randomBytes(16).toString('hex'); // 32 hex chars
console.log(key);
