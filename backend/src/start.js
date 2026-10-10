import app from './server.js';
import { db } from './db.js';
const server = app.listen(process.env.PORT || 3001);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 25000);
    deadline.unref();
    server.close(async () => {
      await db.close();
      clearTimeout(deadline);
      process.exit(0);
    });
  });
}
