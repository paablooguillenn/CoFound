import { pool } from '../config/database';
import { AppError } from '../utils/http-error';

export const getUserPhotos = async (userId: string) => {
  const result = await pool.query<{ id: string; url: string; sort_order: number }>(
    `SELECT id, url, sort_order FROM user_photos WHERE user_id = $1 ORDER BY sort_order`,
    [userId],
  );
  return result.rows;
};

export const getPhotosMap = async (userIds: string[]) => {
  if (!userIds.length) return new Map<string, { id: string; url: string; sortOrder: number }[]>();

  const result = await pool.query<{ user_id: string; id: string; url: string; sort_order: number }>(
    `SELECT user_id, id, url, sort_order FROM user_photos
     WHERE user_id = ANY($1) ORDER BY sort_order`,
    [userIds],
  );

  const map = new Map<string, { id: string; url: string; sortOrder: number }[]>();
  for (const row of result.rows) {
    const arr = map.get(row.user_id) ?? [];
    arr.push({ id: row.id, url: row.url, sortOrder: row.sort_order });
    map.set(row.user_id, arr);
  }
  return map;
};

export const addUserPhoto = async (userId: string, url: string) => {
  // Get next sort order
  const countResult = await pool.query<{ max_order: number | null }>(
    `SELECT MAX(sort_order) as max_order FROM user_photos WHERE user_id = $1`,
    [userId],
  );
  const nextOrder = (countResult.rows[0].max_order ?? -1) + 1;

  if (nextOrder >= 6) {
    throw new AppError('Máximo 6 fotos por perfil', 400);
  }

  const result = await pool.query<{ id: string; url: string; sort_order: number }>(
    `INSERT INTO user_photos (user_id, url, sort_order) VALUES ($1, $2, $3) RETURNING id, url, sort_order`,
    [userId, url, nextOrder],
  );

  // If first photo, set as avatar
  if (nextOrder === 0) {
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, userId]);
  }

  return result.rows[0];
};

export const deleteUserPhoto = async (userId: string, photoId: string) => {
  const result = await pool.query(
    `DELETE FROM user_photos WHERE id = $1 AND user_id = $2 RETURNING sort_order`,
    [photoId, userId],
  );
  if (!result.rowCount) throw new AppError('Foto no encontrada', 404);

  // Reorder remaining photos
  await pool.query(
    `WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) - 1 AS new_order
      FROM user_photos WHERE user_id = $1
    )
    UPDATE user_photos SET sort_order = ordered.new_order
    FROM ordered WHERE user_photos.id = ordered.id`,
    [userId],
  );

  // Update avatar to first photo or null
  const firstPhoto = await pool.query<{ url: string }>(
    `SELECT url FROM user_photos WHERE user_id = $1 ORDER BY sort_order LIMIT 1`,
    [userId],
  );
  await pool.query(
    'UPDATE users SET avatar_url = $1 WHERE id = $2',
    [firstPhoto.rows[0]?.url ?? null, userId],
  );

  return { success: true };
};
