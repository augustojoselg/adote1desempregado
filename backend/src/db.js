import 'dotenv/config';
import pg from 'pg';
import { ManagedIdentityCredential } from '@azure/identity';
import { AsyncLocalStorage } from 'node:async_hooks';

// No database credentials are accepted in URLs or logged.
const identityAuth = process.env.PG_AUTH === 'entra';
const schema = process.env.PGSCHEMA || 'public';
if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('PGSCHEMA inválido.');
if (process.env.NODE_ENV === 'production' && !identityAuth) {
  throw new Error('Produção exige PG_AUTH=entra, sem senha estática.');
}
const credential = identityAuth ? new ManagedIdentityCredential(
  process.env.AZURE_CLIENT_ID ? { clientId: process.env.AZURE_CLIENT_ID } : {},
) : null;
const pool = new pg.Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'emprego',
  user: process.env.PGUSER || 'emprego',
  password: identityAuth
    ? async () => (await credential.getToken('https://ossrdbms-aad.database.windows.net/.default')).token
    : process.env.PGPASSWORD,
  ssl: identityAuth || process.env.PGSSL !== 'disable' ? { rejectUnauthorized: true } : false,
  max: Number(process.env.PGPOOL_MAX || 5),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  options: `-c search_path=${schema} -c statement_timeout=15000`,
});
pool.on('error', () => console.error(JSON.stringify({ event: 'database_connection_error' })));
const transactions = new AsyncLocalStorage();

// Small compatibility layer keeps SQL parameters out of string interpolation.
export function bind(sql, args) {
  let index = 0;
  if (args.length === 1 && args[0] && Object.getPrototypeOf(args[0]) === Object.prototype) {
    const values = [];
    const positions = new Map();
    const text = sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      if (!Object.hasOwn(args[0], name)) throw new Error('Parâmetro SQL ausente.');
      if (!positions.has(name)) { values.push(args[0][name]); positions.set(name, values.length); }
      return `$${positions.get(name)}`;
    });
    return { text, values };
  }
  return { text: sql.replace(/\?/g, () => `$${++index}`), values: args };
}
async function query(sql, args = []) {
  const target = transactions.getStore() || pool;
  return target.query(bind(sql, args));
}
export const db = {
  prepare(sql) {
    return {
      get: async (...args) => (await query(sql, args)).rows[0],
      all: async (...args) => (await query(sql, args)).rows,
      run: async (...args) => ({ changes: (await query(sql, args)).rowCount }),
    };
  },
  exec: sql => query(sql),
  transaction(fn) {
    return async (...args) => {
      if (transactions.getStore()) throw new Error('Transações aninhadas não são suportadas.');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await transactions.run(client, () => fn(...args));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    };
  },
  close: () => pool.end(),
};
export default db;
