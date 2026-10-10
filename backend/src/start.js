import app from './server.js';
const server = app.listen(process.env.PORT || 3001);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
