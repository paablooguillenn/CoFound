import { pool } from '../config/database';
import { AppError } from '../utils/http-error';

export const EVENT_CATEGORIES = ['coffee', 'pitch', 'hackathon', 'workshop', 'networking', 'other'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const ATTENDEE_STATUSES = ['going', 'interested'] as const;
export type AttendeeStatus = (typeof ATTENDEE_STATUSES)[number];

type EventInput = {
  title: string;
  description?: string;
  category: EventCategory;
  city?: string;
  location?: string;
  startsAt: string;
  capacity?: number | null;
};

const ACTIVE_EVENT_LIMIT = 1;

const mapEventRow = (row: any) => ({
  id: row.id,
  organizerId: row.organizer_id,
  organizer: row.organizer_first_name
    ? {
        id: row.organizer_id,
        firstName: row.organizer_first_name,
        lastName: row.organizer_last_name,
        avatarUrl: row.organizer_avatar_url ?? null,
      }
    : null,
  title: row.title,
  description: row.description ?? '',
  category: row.category as EventCategory,
  city: row.city ?? '',
  location: row.location ?? '',
  startsAt: row.starts_at,
  capacity: row.capacity ?? null,
  attendeeCount: Number(row.attendee_count ?? 0),
  myStatus: (row.my_status as AttendeeStatus) ?? null,
  createdAt: row.created_at,
});

export const listUpcomingEvents = async (
  currentUserId: string,
  filters: { city?: string; category?: EventCategory } = {},
) => {
  const where: string[] = ['e.starts_at >= NOW()'];
  const params: unknown[] = [currentUserId];

  if (filters.city) {
    params.push(`%${filters.city}%`);
    where.push(`e.city ILIKE $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`e.category = $${params.length}`);
  }

  const result = await pool.query(
    `SELECT
       e.id, e.organizer_id, e.title, e.description, e.category, e.city, e.location,
       e.starts_at, e.capacity, e.created_at,
       u.first_name AS organizer_first_name,
       u.last_name AS organizer_last_name,
       u.avatar_url AS organizer_avatar_url,
       (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id) AS attendee_count,
       (SELECT status FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = $1) AS my_status
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     WHERE ${where.join(' AND ')}
     ORDER BY e.starts_at ASC
     LIMIT 100`,
    params,
  );

  return result.rows.map(mapEventRow);
};

export const getEventById = async (currentUserId: string, eventId: string) => {
  const eventRes = await pool.query(
    `SELECT
       e.id, e.organizer_id, e.title, e.description, e.category, e.city, e.location,
       e.starts_at, e.capacity, e.created_at,
       u.first_name AS organizer_first_name,
       u.last_name AS organizer_last_name,
       u.avatar_url AS organizer_avatar_url,
       (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id) AS attendee_count,
       (SELECT status FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = $1) AS my_status
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     WHERE e.id = $2`,
    [currentUserId, eventId],
  );
  if (!eventRes.rowCount) {
    throw new AppError('Evento no encontrado', 404);
  }

  const attendeesRes = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, ea.status, ea.joined_at
     FROM event_attendees ea
     JOIN users u ON u.id = ea.user_id
     WHERE ea.event_id = $1
     ORDER BY ea.joined_at ASC
     LIMIT 100`,
    [eventId],
  );

  return {
    ...mapEventRow(eventRes.rows[0]),
    attendees: attendeesRes.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url ?? null,
      status: row.status as AttendeeStatus,
      joinedAt: row.joined_at,
    })),
  };
};

export const createEvent = async (currentUserId: string, input: EventInput) => {
  const verified = await pool.query<{ email_verified: boolean }>(
    'SELECT email_verified FROM users WHERE id = $1',
    [currentUserId],
  );
  if (!verified.rowCount) throw new AppError('User not found', 404);
  if (!verified.rows[0].email_verified) {
    throw new AppError('Verifica tu email antes de crear eventos', 403);
  }

  const startsAtDate = new Date(input.startsAt);
  if (Number.isNaN(startsAtDate.getTime()) || startsAtDate.getTime() <= Date.now()) {
    throw new AppError('La fecha del evento debe ser futura', 400);
  }

  // One active future event per organizer.
  const activeRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM events
     WHERE organizer_id = $1 AND starts_at >= NOW()`,
    [currentUserId],
  );
  if (Number(activeRes.rows[0].count) >= ACTIVE_EVENT_LIMIT) {
    throw new AppError(
      'Ya tienes un evento futuro activo. Edítalo o espera a que pase para crear otro.',
      409,
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO events (organizer_id, title, description, category, city, location, starts_at, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        currentUserId,
        input.title.trim(),
        input.description?.trim() || null,
        input.category,
        input.city?.trim() || null,
        input.location?.trim() || null,
        startsAtDate.toISOString(),
        input.capacity ?? null,
      ],
    );
    // Organizer auto-RSVPs as going.
    await client.query(
      `INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, 'going')`,
      [inserted.rows[0].id, currentUserId],
    );
    await client.query('COMMIT');
    return getEventById(currentUserId, inserted.rows[0].id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateEvent = async (currentUserId: string, eventId: string, input: EventInput) => {
  const own = await pool.query<{ organizer_id: string }>(
    'SELECT organizer_id FROM events WHERE id = $1',
    [eventId],
  );
  if (!own.rowCount) throw new AppError('Evento no encontrado', 404);
  if (own.rows[0].organizer_id !== currentUserId) {
    throw new AppError('Solo el organizador puede editar el evento', 403);
  }

  const startsAtDate = new Date(input.startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    throw new AppError('Fecha inválida', 400);
  }

  await pool.query(
    `UPDATE events
     SET title = $2,
         description = $3,
         category = $4,
         city = $5,
         location = $6,
         starts_at = $7,
         capacity = $8,
         updated_at = NOW()
     WHERE id = $1`,
    [
      eventId,
      input.title.trim(),
      input.description?.trim() || null,
      input.category,
      input.city?.trim() || null,
      input.location?.trim() || null,
      startsAtDate.toISOString(),
      input.capacity ?? null,
    ],
  );

  return getEventById(currentUserId, eventId);
};

export const deleteEvent = async (currentUserId: string, eventId: string) => {
  const own = await pool.query<{ organizer_id: string }>(
    'SELECT organizer_id FROM events WHERE id = $1',
    [eventId],
  );
  if (!own.rowCount) throw new AppError('Evento no encontrado', 404);
  if (own.rows[0].organizer_id !== currentUserId) {
    throw new AppError('Solo el organizador puede borrar el evento', 403);
  }
  await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
  return { success: true };
};

export const setRsvp = async (
  currentUserId: string,
  eventId: string,
  status: AttendeeStatus | null,
) => {
  const event = await pool.query<{ id: string; capacity: number | null }>(
    'SELECT id, capacity FROM events WHERE id = $1 AND starts_at >= NOW()',
    [eventId],
  );
  if (!event.rowCount) throw new AppError('Evento no encontrado o ya pasado', 404);

  if (status === null) {
    await pool.query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, currentUserId],
    );
    return { success: true, status: null };
  }

  // If the event has a capacity and the user isn't already 'going', enforce it.
  if (event.rows[0].capacity != null && status === 'going') {
    const existing = await pool.query<{ status: string }>(
      'SELECT status FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, currentUserId],
    );
    const isAlreadyGoing = existing.rowCount && existing.rows[0].status === 'going';
    if (!isAlreadyGoing) {
      const goingRes = await pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM event_attendees
         WHERE event_id = $1 AND status = 'going'`,
        [eventId],
      );
      if (Number(goingRes.rows[0].count) >= event.rows[0].capacity) {
        throw new AppError('El evento está completo', 409);
      }
    }
  }

  await pool.query(
    `INSERT INTO event_attendees (event_id, user_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status, joined_at = NOW()`,
    [eventId, currentUserId, status],
  );
  return { success: true, status };
};
