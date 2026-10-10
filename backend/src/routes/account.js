import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

import { httpUrl } from '../lib/validation.js';

import { cookieName, cookieOptions } from '../lib/session.js';
const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  bio: z.string().trim().max(600).optional(),
  city: z.string().trim().max(120).optional(),
  linkedin: httpUrl.or(z.literal('')).optional(),
});

// PATCH /api/account — right to rectification (LGPD Art. 18, III)
router.patch('/', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  const fields = parsed.data;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: 'Nada para atualizar.' });

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  await db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, req.user.id);

  const user = await db.prepare('SELECT id, name, role, bio, city, linkedin, created_at, is_admin, company_approved FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

// GET /api/account/export — right to data portability (LGPD Art. 18, V)
// Returns everything we hold about this person in a machine-readable format.
router.get('/export', async (req, res) => {
  const userId = req.user.id;

  const profile = await db
    .prepare('SELECT id, name, role, bio, city, linkedin, consent_given, consent_at, privacy_policy_version, created_at, identity_subject FROM users WHERE id = ?')
    .get(userId);

  const elosAsMentor = await db.prepare('SELECT * FROM elos WHERE mentor_id = ?').all(userId);
  const elosAsProfessional = await db.prepare('SELECT * FROM elos WHERE professional_id = ?').all(userId);
  const jobsPosted = await db.prepare('SELECT * FROM jobs WHERE posted_by = ?').all(userId);
  const consentHistory = await db.prepare('SELECT action, policy_version, created_at FROM consent_log WHERE user_id = ? ORDER BY created_at').all(userId);
  const adminHistory = await db.prepare('SELECT action, created_at FROM admin_audit WHERE target_id = ? ORDER BY created_at').all(userId);

  await db.prepare(`INSERT INTO consent_log (user_id, action) VALUES (?, 'export_requested')`).run(userId);

  res.setHeader('Content-Disposition', `attachment; filename="meus-dados-adote-um-desempregado.json"`);
  res.json({
    exported_at: new Date().toISOString(),
    profile,
    elos_como_mentor: elosAsMentor,
    elos_como_profissional: elosAsProfessional,
    vagas_publicadas: jobsPosted,
    historico_de_consentimento: consentHistory,
    historico_administrativo: adminHistory,
  });
});

// DELETE /api/account — removes related rows and anonymizes the profile atomically.
router.delete('/', async (req, res) => {
  const userId = req.user.id;
  const now = new Date().toISOString();

  await db.transaction(async () => {
    await db.prepare(
      `UPDATE users SET name = 'Usuário removido', bio = '', city = '', linkedin = '', token_hash = '', session_expires_at = NULL, identity_subject = NULL, account_enabled = false, company_approved = false, is_admin = false, consent_given = 0, anonymized_at = ? WHERE id = ?`
    ).run(now, userId);

    await db.prepare(`INSERT INTO consent_log (user_id, action) VALUES (?, 'deletion_requested')`).run(userId);

    await db.prepare('DELETE FROM jobs WHERE posted_by = ?').run(userId);
    await db.prepare('DELETE FROM elos WHERE mentor_id = ? OR professional_id = ?').run(userId, userId);
    await db.prepare("INSERT INTO consent_log (user_id, action) VALUES (?, 'revoked')").run(userId);
  })();
  res.clearCookie(cookieName, cookieOptions);
  res.json({ message: 'Seu perfil foi removido e seus dados pessoais foram anonimizados.' });
});

export default router;
