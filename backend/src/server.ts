import { app } from './app';
import { env } from './config/env';
import { testConnection } from './config/database';
import { runMigrations, seedSyncIfStale } from './db/runMigrations';

const startServer = async () => {
  await testConnection();
  await runMigrations();
  await seedSyncIfStale();

  app.listen(env.PORT, () => {
    console.log(`CoFound API listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Unable to start server', error);
  process.exit(1);
});
