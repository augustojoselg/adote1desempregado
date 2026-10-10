import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { pagination } from '../lib/validation.js';
const router = Router();
router.use(requireAuth, (req, res, next) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Acesso exclusivo da administração.' });
  next();
});
router.get('/users', async (req, res) => {
  const parsed = pagination.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Paginação inválida.' });
  const { limit, offset } = parsed.data;
  const users = await db.prepare('SELECT id, name, role, is_admin, company_approved, account_enabled, created_at FROM users WHERE anonymized_at IS NULL ORDER BY created_at DESC, id LIMIT ? OFFSET ?').all(limit, offset);
  res.json({ users, pagination: { limit, offset } });
});
router.post('/users/:id/:action', async (req, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success || !['disable', 'enable', 'revoke'].includes(req.params.action)) {
    return res.status(400).json({ error: 'Operação inválida.' });
  }
  if (req.params.id === req.user.id) return res.status(409).json({ error: 'Use Sair para encerrar sua sessão. Não suspenda sua própria conta.' });
  const target = await db.prepare('SELECT id FROM users WHERE id = ? AND anonymized_at IS NULL').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Conta não encontrada.' });
  await db.transaction(async () => {
    const disable = req.params.action === 'disable';
    const enable = req.params.action === 'enable';
    await db.prepare("UPDATE users SET token_hash = '', session_expires_at = NULL, account_enabled = CASE WHEN ? THEN false WHEN ? THEN true ELSE account_enabled END WHERE id = ?").run(disable, enable, target.id);
    await db.prepare('INSERT INTO admin_audit (actor_id, target_id, action) VALUES (?, ?, ?)')
      .run(req.user.id, target.id, disable ? 'access_disabled' : enable ? 'access_enabled' : 'session_revoked');
  })();
  res.sendStatus(204);
});
export default router;
