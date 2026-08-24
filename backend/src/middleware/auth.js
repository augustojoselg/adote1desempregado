import { db } from '../db.js';
import { hashToken } from '../lib/crypto.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Envie o token no header Authorization.' });
  }

  const tokenHash = hashToken(token);
  const user = db.prepare('SELECT * FROM users WHERE token_hash = ? AND anonymized_at IS NULL').get(tokenHash);

  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  req.user = user;
  next();
}
