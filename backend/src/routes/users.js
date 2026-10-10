import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

import { z } from 'zod';
import { ROLES } from '../constants.js';
import { pagination } from '../lib/validation.js';
const router = Router();

// GET /api/users — the directory. Requires auth: this is a network of trust,
// not a public listing scraped by search engines or anonymous visitors.
router.get('/', requireAuth, (req, res) => {
  const parsed = pagination.extend({ role: z.enum(ROLES).optional() }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Filtros inválidos.' });
  const { role, limit, offset } = parsed.data;
  const rows = db.prepare(`
    SELECT u.id, u.name, u.role, u.created_at,
      CASE WHEN u.id = @viewer THEN u.bio ELSE '' END AS bio,
      CASE WHEN u.id = @viewer THEN u.linkedin ELSE '' END AS linkedin
    FROM users u WHERE u.anonymized_at IS NULL AND (@role IS NULL OR u.role = @role)
    ORDER BY u.created_at DESC, u.id LIMIT @limit OFFSET @offset
  `).all({ viewer: req.user.id, role: role || null, limit, offset });
  res.json({ users: rows, pagination: { limit, offset } });
});

// GET /api/users/stats — public counters used on the landing/dashboard (no personal data)
router.get('/stats', (req, res) => {
  const mentors = db.prepare(`SELECT COUNT(*) c FROM users WHERE role = 'Mentor' AND anonymized_at IS NULL`).get().c;
  const professionals = db.prepare(`SELECT COUNT(*) c FROM users WHERE role = 'Profissional' AND anonymized_at IS NULL`).get().c;
  const companies = db.prepare(`SELECT COUNT(*) c FROM users WHERE role = 'Empresa' AND anonymized_at IS NULL`).get().c;
  const jobs = db.prepare(`SELECT COUNT(*) c FROM jobs`).get().c;
  const recolocados = db.prepare(`SELECT COUNT(*) c FROM elos WHERE status = 'Recolocado'`).get().c;
  res.json({ mentors, professionals, companies, jobs, recolocados });
});

export default router;
