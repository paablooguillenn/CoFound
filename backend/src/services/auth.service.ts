import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

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

  // Auto-like: all existing users like the new user so matches happen naturally
  await pool.query(
    `INSERT INTO user_likes (sender_id, receiver_id)
     SELECT id, $1 FROM users
     WHERE id <> $1
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
