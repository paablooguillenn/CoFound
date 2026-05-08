/**
 * Lightweight structured logger. Outputs single-line JSON to stdout/stderr
 * so logs are parseable by Railway, Datadog, Loki, etc. without adding a
 * dependency like Pino.
 *
 * Usage: log.info('user.created', { userId, email });
 *        log.warn('email.failed', { to, reason: err.message });
 *        log.error('db.query.failed', { query, error: err.message });
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const emit = (level: LogLevel, event: string, fields: Record<string, unknown> = {}) => {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
};

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => emit('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit('error', event, fields),
};
