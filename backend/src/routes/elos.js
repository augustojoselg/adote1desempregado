import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { generateId } from '../lib/crypto.js';
import { requireAuth } from '../middleware/auth.js';
import { ELO_STATUSES } from '../constants.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  targetUserId: z.string().uuid(),
});

// POST /api/elos — the current user "adopts" (mentor -> professional) or
// "asks for support" (professional -> mentor), depending on their own role.
router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

  const target = db.prepare('SELECT * FROM users WHERE id = ? AND anonymized_at IS NULL').get(parsed.data.targetUserId);
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });

  let mentorId, professionalId;
  if (req.user.role === 'Mentor' && target.role === 'Profissional') {
    mentorId = req.user.id;
    professionalId = target.id;
  } else if (req.user.role === 'Profissional' && target.role === 'Mentor') {
    mentorId = target.id;
    professionalId = req.user.id;
  } else {
    return res.status(400).json({ error: 'Elo só pode ser criado entre um mentor e um profissional.' });
  }

  const existing = db
    .prepare('SELECT * FROM elos WHERE mentor_id = ? AND professional_id = ?')
    .get(mentorId, professionalId);
  if (existing) return res.status(409).json({ error: 'Esse elo já existe.', elo: existing });

  const id = generateId();
  db.prepare('INSERT INTO elos (id, mentor_id, professional_id) VALUES (?, ?, ?)').run(id, mentorId, professionalId);
  const elo = db.prepare('SELECT * FROM elos WHERE id = ?').get(id);
  res.status(201).json({ elo });
});

// GET /api/elos/mine
router.get('/mine', (req, res) => {
  const rows = db
    .prepare(
      `SELECT elos.*, m.name as mentor_name, p.name as professional_name
       FROM elos
       JOIN users m ON m.id = elos.mentor_id
       JOIN users p ON p.id = elos.professional_id
       WHERE elos.mentor_id = ? OR elos.professional_id = ?
       ORDER BY elos.created_at DESC`
    )
    .all(req.user.id, req.user.id);
  res.json({ elos: rows });
});

const statusSchema = z.object({ status: z.enum(ELO_STATUSES) });

// PATCH /api/elos/:id/status — only the mentor or professional in the elo can update it
router.patch('/:id/status', (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Status inválido.' });

  const elo = db.prepare('SELECT * FROM elos WHERE id = ?').get(req.params.id);
  if (!elo) return res.status(404).json({ error: 'Elo não encontrado.' });
  if (elo.mentor_id !== req.user.id && elo.professional_id !== req.user.id) {
    return res.status(403).json({ error: 'Você não faz parte desse elo.' });
  }

  db.prepare('UPDATE elos SET status = ? WHERE id = ?').run(parsed.data.status, req.params.id);
  const updated = db.prepare('SELECT * FROM elos WHERE id = ?').get(req.params.id);
  res.json({ elo: updated });
});

export default router;
