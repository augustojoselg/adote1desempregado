import { db } from '../db.js';
import { sessionToken, allowBearer, requireSameOrigin } from '../lib/session.js';
import { hashToken } from '../lib/crypto.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = sessionToken(req) || (allowBearer() && header.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Entre novamente no aplicativo.' });
  }

  const tokenHash = hashToken(token);
  const user = await db.prepare('SELECT * FROM users WHERE token_hash = ? AND account_enabled = true AND anonymized_at IS NULL AND session_expires_at > ?').get(tokenHash, new Date().toISOString());

  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  req.user = user;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return requireSameOrigin(req, res, next);
  next();
}
