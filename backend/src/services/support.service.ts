import { pool } from '../config/database';
import { env } from '../config/env';
import { renderSupportMessageEmail, sendEmail } from '../utils/email';
import { AppError } from '../utils/http-error';

type SupportInput = {
  userId: string;
  subject: string;
  body: string;
};

export const createSupportMessage = async ({ userId, subject, body }: SupportInput) => {
  const userResult = await pool.query<{ email: string; first_name: string; last_name: string }>(
    'SELECT email, first_name, last_name FROM users WHERE id = $1',
    [userId],
  );
  if (!userResult.rowCount) {
    throw new AppError('User not found', 404);
  }
  const user = userResult.rows[0];

  const insertResult = await pool.query<{ id: string; created_at: Date }>(
    `INSERT INTO support_messages (user_id, email, subject, body)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [userId, user.email, subject.trim(), body.trim()],
  );
  const inserted = insertResult.rows[0];

  // Fire-and-forget: notify the support inbox. Failure here MUST NOT block
  // the API success — the message is already persisted in the DB.
  sendEmail({
    to: env.SUPPORT_EMAIL,
    subject: `[Soporte CoFound] ${subject.trim()}`,
    html: renderSupportMessageEmail({
      from: `${user.first_name} ${user.last_name}`,
      fromEmail: user.email,
      subject: subject.trim(),
      body: body.trim(),
      ticketId: inserted.id,
    }),
  }).catch((err) => {
    console.error(`[support] Failed to forward message ${inserted.id} to ${env.SUPPORT_EMAIL}:`, err.message);
  });

  return {
    success: true,
    ticketId: inserted.id,
    createdAt: inserted.created_at,
  };
};

export const listSupportMessages = async () => {
  const result = await pool.query<{
    id: string;
    user_id: string | null;
    email: string;
    subject: string;
    body: string;
    status: string;
    created_at: Date;
    resolved_at: Date | null;
  }>(
    `SELECT id, user_id, email, subject, body, status, created_at, resolved_at
     FROM support_messages
     ORDER BY created_at DESC
     LIMIT 200`,
  );
  return result.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    email: r.email,
    subject: r.subject,
    body: r.body,
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  }));
};
