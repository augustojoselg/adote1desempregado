import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { generateId, generateToken, hashToken } from '../lib/crypto.js';
import { requireAuth } from '../middleware/auth.js';
import { ROLES, PRIVACY_POLICY_VERSION } from '../constants.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  role: z.enum(ROLES),
  bio: z.string().trim().max(600).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  linkedin: z.string().trim().max(200).optional().default(''),
  // Explicit, unambiguous consent — LGPD Art. 8. Must be `true`, not just "present".
  consent: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade para se cadastrar.' }),
  }),
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }
  const { name, role, bio, city, linkedin } = parsed.data;

  const id = generateId();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, name, role, bio, city, linkedin, token_hash, consent_given, consent_at, privacy_policy_version, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  ).run(id, name, role, bio, city, linkedin, tokenHash, now, PRIVACY_POLICY_VERSION, now);

  db.prepare(
    `INSERT INTO consent_log (user_id, action, policy_version) VALUES (?, 'given', ?)`
  ).run(id, PRIVACY_POLICY_VERSION);

  const user = db.prepare('SELECT id, name, role, bio, city, linkedin, created_at FROM users WHERE id = ?').get(id);

  // The raw token is returned ONCE. The client must store it (e.g. localStorage)
  // to authenticate future requests. It cannot be recovered if lost — the user
  // would need to sign up again, since we never store the raw value.
  res.status(201).json({ user, token });
});

// GET /api/auth/me — confirms the token is valid and returns the current user
router.get('/me', requireAuth, (req, res) => {
  const { id, name, role, bio, city, linkedin, created_at } = req.user;
  res.json({ user: { id, name, role, bio, city, linkedin, created_at } });
});

export default router;
