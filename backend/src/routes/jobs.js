import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { generateId } from '../lib/crypto.js';
import { requireAuth } from '../middleware/auth.js';

import { httpUrl, pagination } from '../lib/validation.js';
import { identityEnabled } from '../lib/identity.js';
const router = Router();

// GET /api/jobs — public within the network (auth required, same reasoning as directory)
router.get('/', requireAuth, async (req, res) => {
  const parsed = pagination.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Paginação inválida.' });
  const { limit, offset } = parsed.data;
  const rows = await db
    .prepare(
      `SELECT jobs.*, users.name as posted_by_name FROM jobs
       JOIN users ON users.id = jobs.posted_by
       WHERE users.anonymized_at IS NULL ORDER BY jobs.created_at DESC, jobs.id LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
  res.json({ jobs: rows });
});

const createSchema = z.object({
  company: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(150),
  location: z.string().trim().max(150).optional().default(''),
  link: httpUrl,
});

// POST /api/jobs — only companies can post
router.post('/', requireAuth, async (req, res) => {
  if (req.user.role !== 'Empresa' || (identityEnabled && !req.user.company_approved)) {
    return res.status(403).json({ error: 'Apenas contas do tipo Empresa podem publicar vagas.' });
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });

  const id = generateId();
  const { company, title, location, link } = parsed.data;
  await db.prepare('INSERT INTO jobs (id, company, title, location, link, posted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    company,
    title,
    location,
    link,
    req.user.id
  );
  const job = await db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  res.status(201).json({ job });
});

export default router;
