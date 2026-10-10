import crypto from 'crypto';

// Server-managed sessions persist only a hash; raw tokens travel exclusively in HttpOnly cookies in production.

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateId() {
  return crypto.randomUUID();
}
