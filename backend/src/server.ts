import { app } from './app';
import { env } from './config/env';
import { testConnection } from './config/database';

const startServer = async () => {
  await testConnection();

  app.listen(env.PORT, () => {
    console.log(`CoFound API listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Unable to start server', error);
  process.exit(1);
});
