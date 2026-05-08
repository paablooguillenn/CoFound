-- Backfill: rellena entrepreneur_level, goal, linkedin_username e instagram_username
-- en los usuarios seed existentes (los creados por seed.sql con dominio @cofound-seed.com).
-- Ejecutar una vez: psql $DATABASE_URL -f backfill_seed_extras.sql
--
-- Asigna valores aleatorios pero deterministas (basados en el id) para que cada
-- usuario seed tenga uno de los 3 niveles, uno de los 3 objetivos y un usuario
-- de LinkedIn / Instagram derivado de su nombre. NO sobreescribe valores que
-- ya tengan algo (idempotente: se puede ejecutar múltiples veces).

UPDATE users
SET entrepreneur_level = (ARRAY['principiante', 'intermedio', 'avanzado'])[
  (abs(hashtext(id::text)) % 3) + 1
]
WHERE email LIKE '%@cofound-seed.com'
  AND entrepreneur_level IS NULL;

UPDATE users
SET goal = (ARRAY['learn_skill', 'find_partner', 'networking'])[
  (abs(hashtext(id::text || 'goal')) % 3) + 1
]
WHERE email LIKE '%@cofound-seed.com'
  AND goal IS NULL;

-- LinkedIn: usuario tipo "nombre-apellido" en minúsculas, sin acentos.
UPDATE users
SET linkedin_username = lower(
  regexp_replace(
    translate(first_name || '-' || last_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
    '[^A-Za-z0-9-]', '', 'g'
  )
)
WHERE email LIKE '%@cofound-seed.com'
  AND linkedin_username IS NULL;

-- Instagram: usuario tipo "nombreapellido" sin guion ni acentos, máx 24 chars.
UPDATE users
SET instagram_username = substring(
  lower(
    regexp_replace(
      translate(first_name || last_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
      '[^A-Za-z0-9._]', '', 'g'
    )
  ),
  1, 24
)
WHERE email LIKE '%@cofound-seed.com'
  AND instagram_username IS NULL;

-- Resumen
SELECT
  count(*) FILTER (WHERE entrepreneur_level IS NOT NULL) AS with_level,
  count(*) FILTER (WHERE goal IS NOT NULL) AS with_goal,
  count(*) FILTER (WHERE linkedin_username IS NOT NULL) AS with_linkedin,
  count(*) FILTER (WHERE instagram_username IS NOT NULL) AS with_instagram,
  count(*) AS total_seeds
FROM users
WHERE email LIKE '%@cofound-seed.com';
