import crypto from 'crypto';

// We never store the raw token — only its hash. The raw token is shown to the
// user exactly once (at signup) and must be kept by their client, similar to
// an API key. This is a lightweight auth model; see backend/README.md for
// its limitations and recommended upgrade path (e-mail + magic link, etc.).

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateId() {
  return crypto.randomUUID();
}
