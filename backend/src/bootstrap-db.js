import pg from 'pg';
import { ManagedIdentityCredential } from '@azure/identity';
import { db } from './db.js';
import { migrate, grantRuntime } from './migrate.js';
const role = process.env.RUNTIME_DB_ROLE;
const oid = process.env.RUNTIME_IDENTITY_OBJECT_ID;
if (!/^[a-z][a-z0-9-]{2,62}$/.test(role || '') || !/^[a-f0-9-]{36}$/.test(oid || '')) throw new Error('Identidade inválida.');
const credential = new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID });
const admin = new pg.Client({
  host: process.env.PGHOST, database: 'postgres', user: process.env.PGUSER,
  password: async () => (await credential.getToken('https://ossrdbms-aad.database.windows.net/.default')).token,
  ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 10000,
});
try {
  await admin.connect();
  const principals = await admin.query('SELECT * FROM pg_catalog.pgaadauth_list_principals(false)');
  const existing = principals.rows.find(row => row.rolname === role);
  if (existing && existing.objectid?.toLowerCase() !== oid.toLowerCase()) throw new Error('Identidade existente diverge do OID esperado.');
  if (!existing) await admin.query('SELECT * FROM pg_catalog.pgaadauth_create_principal_with_oid($1, $2, $3, false, false)', [role, oid, 'service']);
  await migrate();
  await grantRuntime();
  console.log('Esquema e permissões de runtime aplicados.');
} catch {
  console.error('Falha no bootstrap do banco; nenhuma credencial será registrada.');
  process.exitCode = 1;
} finally { await admin.end(); await db.close(); }
