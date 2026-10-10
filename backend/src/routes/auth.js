import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { generateId } from '../lib/crypto.js';
import { requireAuth } from '../middleware/auth.js';
import { ROLES, PRIVACY_POLICY_VERSION } from '../constants.js';

import { httpUrl } from '../lib/validation.js';

import { cookieName, cookieOptions, allowBearer, requireSameOrigin } from '../lib/session.js';
import { identityEnabled, registrationIdentity, clearRegistration, issueSession, login, callback } from '../lib/identity.js';
const router = Router();
router.get('/config', (req, res) => {
  const identity = registrationIdentity(req);
  res.json({ provider: identityEnabled ? 'entra' : 'development', identityReady: !!identity, canRegisterCompany: !identityEnabled || !!identity?.company });
});
router.get('/login', login);
router.get('/callback', callback);

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  role: z.enum(ROLES),
  bio: z.string().trim().max(600).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  linkedin: httpUrl.or(z.literal('')).optional().default(''),
  // Explicit, unambiguous consent — LGPD Art. 8. Must be `true`, not just "present".
  consent: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade para se cadastrar.' }),
  }),
});

// POST /api/auth/signup
router.post('/signup', requireSameOrigin, async (req, res) => {
  const identity = registrationIdentity(req);
  if (identityEnabled && !identity) return res.status(401).json({ error: 'Entre com sua conta Microsoft antes de cadastrar o perfil.' });
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  const { name, role, bio, city, linkedin } = parsed.data;
  if (identityEnabled && role === 'Empresa' && !identity.company) {
    return res.status(403).json({ error: 'A operação precisa autorizar o cadastro empresarial.' });
  }

  const id = generateId();
  const now = new Date().toISOString();

  await db.transaction(async () => {
    await db.prepare(
      `INSERT INTO users (id, name, role, bio, city, linkedin, token_hash, consent_given, consent_at, privacy_policy_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
    ).run(id, name, role, bio, city, linkedin, '', now, PRIVACY_POLICY_VERSION, now);

    await db.prepare(
      `INSERT INTO consent_log (user_id, action, policy_version) VALUES (?, 'given', ?)`
    ).run(id, PRIVACY_POLICY_VERSION);

    if (identity) await db.prepare('UPDATE users SET identity_subject = ?, company_approved = ?, is_admin = ? WHERE id = ?')
      .run(identity.subject, identity.company, identity.admin, id);
  })();
  const user = await db.prepare('SELECT id, name, role, bio, city, linkedin, created_at, is_admin, company_approved FROM users WHERE id = ?').get(id);

  const token = await issueSession(res, id);
  clearRegistration(res);
  res.status(201).json({ user, ...(allowBearer() ? { token } : {}) });
});

// GET /api/auth/me — confirms the token is valid and returns the current user
router.get('/me', requireAuth, async (req, res) => {
  const { id, name, role, bio, city, linkedin, created_at, is_admin, company_approved } = req.user;
  res.json({ user: { id, name, role, bio, city, linkedin, created_at, is_admin, company_approved } });
});

router.post('/logout', requireAuth, async (req, res) => {
  await db.prepare("UPDATE users SET token_hash = '', session_expires_at = NULL WHERE id = ?").run(req.user.id);
  res.clearCookie(cookieName, cookieOptions);
  res.sendStatus(204);
});
export default router;
