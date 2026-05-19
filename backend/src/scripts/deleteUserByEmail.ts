/**
 * Script one-shot para borrar un usuario por email.
 * Uso: npx ts-node src/scripts/deleteUserByEmail.ts <email>
 * Las relaciones tienen ON DELETE CASCADE así que limpia skills, likes,
 * matches, messages, photos, etc. automáticamente.
 */
import { pool } from '../config/database';

const main = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: ts-node deleteUserByEmail.ts <email>');
    process.exit(1);
  }

  console.log(`[admin] Buscando usuario con email: ${email}`);
  const lookup = await pool.query<{ id: string; first_name: string; last_name: string }>(
    'SELECT id, first_name, last_name FROM users WHERE email = $1',
    [email.trim().toLowerCase()],
  );

  if (!lookup.rowCount) {
    console.log('[admin] No existe ningún usuario con ese email.');
    process.exit(0);
  }

  const { id, first_name, last_name } = lookup.rows[0];
  console.log(`[admin] Encontrado: ${first_name} ${last_name} (${id})`);

  // Limpieza explícita por si hay tablas sin ON DELETE CASCADE
  console.log('[admin] Borrando referencias...');
  await pool.query('DELETE FROM reports WHERE reporter_id = $1 OR reported_id = $1', [id]);
  await pool.query('DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1', [id]);

  console.log('[admin] Borrando usuario...');
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

  console.log(`[admin] ✓ Usuario borrado (${result.rowCount} row).`);
  await pool.end();
};

main().catch((err) => {
  console.error('[admin] Error:', err);
  process.exit(1);
});
