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

/**
 * Reorders the user's photos according to the given list of photo IDs.
 * The first ID becomes sort_order=0 (the user's avatar). Photos owned by the
 * user but missing from the list are appended in their existing order.
 */
export const reorderUserPhotos = async (userId: string, orderedIds: string[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const owned = await client.query<{ id: string; sort_order: number }>(
      'SELECT id, sort_order FROM user_photos WHERE user_id = $1 ORDER BY sort_order',
      [userId],
    );
    const ownedIds = new Set(owned.rows.map((r) => r.id));

    // Filter to only photos the user owns, preserving caller's order, then
    // append any owned photos the caller forgot (defensive — shouldn't happen
    // in the normal UI flow).
    const cleaned = orderedIds.filter((id) => ownedIds.has(id));
    const tail = owned.rows
      .map((r) => r.id)
      .filter((id) => !cleaned.includes(id));
    const finalOrder = [...cleaned, ...tail];

    for (let i = 0; i < finalOrder.length; i += 1) {
      await client.query(
        'UPDATE user_photos SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [i, finalOrder[i], userId],
      );
    }

    // The first photo also doubles as the user's avatar.
    if (finalOrder.length > 0) {
      const firstUrl = await client.query<{ url: string }>(
        'SELECT url FROM user_photos WHERE id = $1',
        [finalOrder[0]],
      );
      await client.query(
        'UPDATE users SET avatar_url = $1 WHERE id = $2',
        [firstUrl.rows[0]?.url ?? null, userId],
      );
    }

    await client.query('COMMIT');
    return { success: true, order: finalOrder };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
