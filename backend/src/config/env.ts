import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:8081'),
  ALLOWED_ORIGINS: z.string().default('*'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('CoFound <onboarding@resend.dev>'),
  SUPPORT_EMAIL: z.string().default('soporte@cofound.space'),
  ADMIN_EMAILS: z.string().default(''),
  // When 'true', sending a message in chat triggers an automatic Groq-generated
  // reply attributed to the other user (academic demo mode). Disable in real
  // production with AI_AUTO_REPLY=false.
  AI_AUTO_REPLY: z.string().default('true'),
});

export const env = envSchema.parse(process.env);
