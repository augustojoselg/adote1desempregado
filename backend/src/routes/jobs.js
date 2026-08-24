import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { generateId } from '../lib/crypto.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/jobs — public within the network (auth required, same reasoning as directory)
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT jobs.*, users.name as posted_by_name FROM jobs
       JOIN users ON users.id = jobs.posted_by
       ORDER BY jobs.created_at DESC`
    )
    .all();
  res.json({ jobs: rows });
});

const createSchema = z.object({
  company: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(150),
  location: z.string().trim().max(150).optional().default(''),
  link: z.string().trim().url('Link inválido'),
});

// POST /api/jobs — only companies can post
router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'Empresa') {
    return res.status(403).json({ error: 'Apenas contas do tipo Empresa podem publicar vagas.' });
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const id = generateId();
  const { company, title, location, link } = parsed.data;
  db.prepare('INSERT INTO jobs (id, company, title, location, link, posted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    company,
    title,
    location,
    link,
    req.user.id
  );
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  res.status(201).json({ job });
});

export default router;
