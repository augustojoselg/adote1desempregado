import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db.js';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import userRoutes from './routes/users.js';
import eloRoutes from './routes/elos.js';
import jobRoutes from './routes/jobs.js';
import adminRoutes from './routes/admin.js';
import { identityEnabled } from './lib/identity.js';

const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
if (process.env.NODE_ENV === 'production' && !identityEnabled) throw new Error('Produção exige AUTH_PROVIDER=entra.');

// Enable only when the API is reachable exclusively through trusted proxies.
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(proxyHops) || proxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS deve ser um inteiro não negativo.');
}
app.set('trust proxy', proxyHops);
const localHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(FRONTEND_ORIGIN) && process.env.SESSION_COOKIE_SECURE === 'false';
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_ORIGIN?.startsWith('https://') && !localHttp) {
  throw new Error('Produção exige FRONTEND_ORIGIN HTTPS explícita.');
}
app.disable('x-powered-by');
app.disable('etag');
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Generic rate limit for the whole API
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Tighter limit on signup specifically, to slow down abuse/spam sign-ups
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/ready', async (req, res) => {
  try { await db.prepare('SELECT 1 AS ok').get(); res.json({ ok: true }); }
  catch { res.status(503).json({ ok: false }); }
});

app.use('/api/auth/signup', signupLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/users', userRoutes);
app.use('/api/elos', eloRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(JSON.stringify({ event: 'request_error', type: err.name || 'Error' }));
  if (err.code === '23505') return res.status(409).json({ error: 'Registro já existe.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

export default app;
