import crypto from 'node:crypto';

const NAME_PATTERN = /^[A-Za-z0-9]{1,16}$/;
const EDIT_TOKEN_TTL_MS = 30 * 60 * 1000;

export function validatePlayerName(name) {
  return typeof name === 'string' && NAME_PATTERN.test(name);
}

export function generateEditToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = hashEditToken(token);
  const expiresAt = new Date(Date.now() + EDIT_TOKEN_TTL_MS);
  return { token, hash, expiresAt };
}

export function hashEditToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
