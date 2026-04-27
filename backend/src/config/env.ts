import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:8081'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('CoFound <onboarding@resend.dev>'),
});

export const env = envSchema.parse(process.env);
