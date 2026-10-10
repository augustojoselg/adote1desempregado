import { readFile } from 'node:fs/promises';
import { db } from './db.js';
const columns = {
  users: ['id','name','role','bio','city','linkedin','token_hash','consent_given','consent_at','privacy_policy_version','anonymized_at','created_at','session_expires_at'],
  elos: ['id','mentor_id','professional_id','status','created_at'],
  jobs: ['id','company','title','location','link','posted_by','created_at'],
  consent_log: ['id','user_id','action','policy_version','created_at'],
};
try {
  const source = JSON.parse(await readFile(process.argv[2], 'utf8'));
  await db.transaction(async () => {
    for (const table of Object.keys(columns)) {
      if (!Array.isArray(source[table])) throw new Error('Exportação incompleta.');
      if (Number((await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).n)) throw new Error('Destino precisa estar vazio.');
      for (const original of source[table]) {
        // Old browser tokens are invalidated at the migration boundary.
        const row = table === 'users' ? { ...original, token_hash: '', session_expires_at: null } : original;
        const values = columns[table].map(column => {
          const value = row[column] ?? null;
          return typeof value === 'string' && /_at$/.test(column) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(' ', 'T') + 'Z' : value;
        });
        await db.prepare(`INSERT INTO ${table} (${columns[table].join(',')}) VALUES (${values.map(() => '?').join(',')})`).run(...values);
      }
      const count = Number((await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).n);
      if (count !== source[table].length) throw new Error('Contagem divergente.');
    }
    await db.exec("SELECT setval(pg_get_serial_sequence('consent_log', 'id'), COALESCE((SELECT MAX(id) FROM consent_log), 1), EXISTS(SELECT 1 FROM consent_log))");
  })();
  console.log('Importação aplicada em transação; contagens e chaves estrangeiras verificadas. Sessões antigas invalidadas.');
} catch {
  console.error('Importação não concluída; nenhuma linha parcial foi confirmada. Revise estrutura, destino vazio e integridade da origem.');
  process.exitCode = 1;
} finally { await db.close(); }
