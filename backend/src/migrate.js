import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { db } from './db.js';
export async function migrate(database = db) {
  await database.transaction(async () => {
    await database.exec('SELECT pg_advisory_xact_lock(104201026)');
    await database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    for (const [version, file] of [[1, '001-foundation.sql'], [2, '002-identity.sql']]) {
      const existing = await database.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version);
      if (!existing) {
        await database.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
        await database.prepare('INSERT INTO schema_migrations(version) VALUES (?)').run(version);
      }
    }
  })();
}
export async function grantRuntime(database = db) {
  const name = process.env.RUNTIME_DB_ROLE;
  const oid = process.env.RUNTIME_IDENTITY_OBJECT_ID;
  if (!name && !oid) return;
  if (!/^[a-z][a-z0-9-]{2,62}$/.test(name || '') || !/^[a-f0-9-]{36}$/.test(oid || '')) throw new Error('Identidade de runtime inválida.');
  // pgaadauth extension functions must run in the postgres database (see bootstrap-db.js).
  const role = `"${name}"`;
  await database.exec(`REVOKE CREATE ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO ${role}; GRANT SELECT, INSERT, UPDATE, DELETE ON users, elos, jobs, consent_log TO ${role}; GRANT SELECT, INSERT ON admin_audit TO ${role}; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role};`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await migrate(); await grantRuntime(); console.log('Migração aplicada.'); }
  catch { console.error('Falha na migração. Consulte a operação do banco sem registrar credenciais.'); process.exitCode = 1; }
  finally { await db.close(); }
}
