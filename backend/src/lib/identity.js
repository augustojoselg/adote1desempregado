import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import * as oidc from 'openid-client';
import { db } from '../db.js';
import { generateToken, hashToken } from './crypto.js';
import { cookieName, cookieOptions } from './session.js';

export const identityEnabled = process.env.AUTH_PROVIDER === 'entra';
const tenantId = process.env.OIDC_TENANT_ID;
const clientId = process.env.OIDC_CLIENT_ID;
const key = identityEnabled ? Buffer.from(process.env.OIDC_COOKIE_KEY || '', 'base64') : null;
if (identityEnabled && (!/^[a-f0-9-]{36}$/i.test(tenantId || '') ||
    !/^[a-f0-9-]{36}$/i.test(clientId || '') || !process.env.OIDC_CLIENT_SECRET || key.length !== 32)) {
  throw new Error('Configuração Entra incompleta. Use referências do Key Vault.');
}
const temporaryOptions = { ...cookieOptions, sameSite: 'lax', maxAge: 10 * 60 * 1000 };
const stateCookie = 'adote_oidc';
const registrationCookie = 'adote_registration';
let configuration;
async function getConfiguration() {
  if (!configuration) {
    configuration = oidc.discovery(new URL(`https://login.microsoftonline.com/${tenantId}/v2.0`),
      clientId, process.env.OIDC_CLIENT_SECRET, oidc.ClientSecretPost(process.env.OIDC_CLIENT_SECRET))
      .then(config => { oidc.enableNonRepudiationChecks(config); return config; })
      .catch(error => { configuration = null; throw error; });
  }
  return configuration;
}
function readCookie(req, name) {
  return (req.headers.cookie || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(name + '='))?.slice(name.length + 1);
}
export function sealContext(value, purpose) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ ...value, exp: Date.now() + 600000 })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function openContext(encoded, purpose) {
  try {
    if (!encoded || encoded.length > 3500) return null;
    const data = Buffer.from(encoded, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(data.subarray(12, 28));
    const value = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString());
    return value.exp > Date.now() ? value : null;
  } catch { return null; }
}
export function registrationIdentity(req) {
  return identityEnabled ? openContext(readCookie(req, registrationCookie), 'registration') : null;
}
export function clearRegistration(res) {
  res.clearCookie(registrationCookie, temporaryOptions);
}
export async function issueSession(res, userId) {
  const token = generateToken();
  const maxAge = (identityEnabled ? 1 : 7) * 86400000;
  await db.prepare('UPDATE users SET token_hash = ?, session_expires_at = ? WHERE id = ?')
    .run(hashToken(token), new Date(Date.now() + maxAge).toISOString(), userId);
  res.cookie(cookieName, token, { ...cookieOptions, maxAge });
  return token;
}
export async function login(req, res) {
  if (!identityEnabled) return res.status(404).json({ error: 'Login Entra não configurado neste ambiente.' });
  const config = await getConfiguration();
  const verifier = oidc.randomPKCECodeVerifier();
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  res.cookie(stateCookie, sealContext({ verifier, state, nonce }, 'oidc'), temporaryOptions);
  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: process.env.FRONTEND_ORIGIN + '/api/auth/callback', scope: 'openid profile',
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256',
    state, nonce, prompt: 'select_account',
  });
  res.redirect(303, url.href);
}
export async function callback(req, res) {
  res.clearCookie(stateCookie, temporaryOptions);
  clearRegistration(res);
  if (!identityEnabled) return res.sendStatus(404);
  const context = openContext(readCookie(req, stateCookie), 'oidc');
  if (!context) return res.status(401).json({ error: 'Login expirado. Inicie novamente pelo aplicativo.' });
  try {
    const tokens = await oidc.authorizationCodeGrant(await getConfiguration(),
      new URL(process.env.FRONTEND_ORIGIN + req.originalUrl), {
        expectedState: context.state, expectedNonce: context.nonce,
        pkceCodeVerifier: context.verifier, idTokenExpected: true,
      });
    const claims = tokens.claims();
    const roles = Array.isArray(claims.roles) ? claims.roles : [];
    if (claims.tid !== tenantId || !/^[a-f0-9-]{36}$/i.test(claims.oid || '') ||
        !roles.some(role => ['Member', 'Company', 'Admin'].includes(role))) {
      return res.status(403).json({ error: 'Solicite à operação a autorização para este aplicativo.' });
    }
    const identity = { subject: `${tenantId}:${claims.oid}`, company: roles.includes('Company') || roles.includes('Admin'), admin: roles.includes('Admin') };
    const user = await db.prepare('SELECT id, account_enabled FROM users WHERE identity_subject = ? AND anonymized_at IS NULL').get(identity.subject);
    if (user) {
      if (!user.account_enabled) return res.status(403).json({ error: 'Acesso suspenso. Procure a operação.' });
      await db.prepare('UPDATE users SET company_approved = ?, is_admin = ? WHERE id = ?').run(identity.company, identity.admin, user.id);
      await issueSession(res, user.id);
    } else {
      res.cookie(registrationCookie, sealContext(identity, 'registration'), temporaryOptions);
    }
    res.redirect(303, process.env.FRONTEND_ORIGIN + '/');
  } catch {
    console.error(JSON.stringify({ event: 'identity_login_failed' }));
    res.status(401).json({ error: 'Não foi possível concluir o login. Volte ao aplicativo e tente novamente.' });
  }
}
