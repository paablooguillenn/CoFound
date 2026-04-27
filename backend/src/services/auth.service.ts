import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { renderPasswordResetEmail, sendEmail } from '../utils/email';

type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginInput = {
  email: string;
  password: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const registerUser = async ({ email, password, firstName, lastName }: RegisterInput) => {
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

  if (existingUser.rowCount) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(password);

  const result = await pool.query<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    is_premium: boolean;
  }>(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, avatar_url, is_premium`,
    [normalizedEmail, passwordHash, firstName.trim(), lastName.trim()],
  );

  const user = result.rows[0];

  // Auto-like: a random sample of existing users likes the new user so matches feel organic
  await pool.query(
    `INSERT INTO user_likes (sender_id, receiver_id)
     SELECT id, $1 FROM users
     WHERE id <> $1
     ORDER BY RANDOM()
     LIMIT 10
     ON CONFLICT DO NOTHING`,
    [user.id],
  );

  return {
    token: signToken({ userId: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url ?? null,
      isPremium: user.is_premium ?? false,
    },
  };
};

const RESET_CODE_TTL_MINUTES = 15;

const generateSixDigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);

  const userResult = await pool.query<{ id: string; first_name: string }>(
    'SELECT id, first_name FROM users WHERE email = $1',
    [normalizedEmail],
  );

  if (!userResult.rowCount) return { success: true };

  const user = userResult.rows[0];
  const code = generateSixDigitCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);

  await pool.query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id],
  );

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, codeHash, expiresAt],
  );

  await sendEmail({
    to: normalizedEmail,
    subject: `${code} es tu código de CoFound`,
    html: renderPasswordResetEmail(user.first_name, code),
  });

  return { success: true };
};

export const confirmPasswordReset = async ({
  email,
  code,
  newPassword,
}: {
  email: string;
  code: string;
  newPassword: string;
}) => {
  const normalizedEmail = normalizeEmail(email);

  const userResult = await pool.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [normalizedEmail],
  );
  if (!userResult.rowCount) {
    throw new AppError('Código incorrecto o caducado', 400);
  }
  const userId = userResult.rows[0].id;

  const tokenResult = await pool.query<{ id: string; token_hash: string }>(
    `SELECT id, token_hash FROM password_reset_tokens
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  if (!tokenResult.rowCount) {
    throw new AppError('Código incorrecto o caducado', 400);
  }
  const token = tokenResult.rows[0];

  const isValid = await comparePassword(code, token.token_hash);
  if (!isValid) {
    throw new AppError('Código incorrecto o caducado', 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, userId],
    );
    await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
      [token.id],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { success: true };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const normalizedEmail = normalizeEmail(email);

  const result = await pool.query<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    password_hash: string;
    is_premium: boolean;
  }>(
    `SELECT id, email, first_name, last_name, avatar_url, password_hash, is_premium
     FROM users
     WHERE email = $1`,
    [normalizedEmail],
  );

  if (!result.rowCount) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = result.rows[0];
  const isValidPassword = await comparePassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  return {
    token: signToken({ userId: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url ?? null,
      isPremium: user.is_premium ?? false,
    },
  };
};
