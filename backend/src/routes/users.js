import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/users — the directory. Requires auth: this is a network of trust,
// not a public listing scraped by search engines or anonymous visitors.
router.get('/', requireAuth, (req, res) => {
  const { role } = req.query;
  let rows;
  if (role) {
    rows = db
      .prepare('SELECT id, name, role, bio, city, linkedin, created_at FROM users WHERE role = ? AND anonymized_at IS NULL ORDER BY created_at DESC')
      .all(role);
  } else {
    rows = db
      .prepare('SELECT id, name, role, bio, city, linkedin, created_at FROM users WHERE anonymized_at IS NULL ORDER BY created_at DESC')
      .all();
  }
  res.json({ users: rows });
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
