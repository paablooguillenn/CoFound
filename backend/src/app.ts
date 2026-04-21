import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { apiRouter } from './routes';

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api', apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
