BEGIN;

-- 0. Borrar reports y blocked_users (FKs sin CASCADE) para no bloquear el DELETE de users.
DELETE FROM reports;
DELETE FROM blocked_users;

-- 1. Eliminar usuarios no-seed (los creados por el usuario). CASCADE borra photos/skills/likes/matches/messages.
DELETE FROM users WHERE email NOT LIKE '%@email.com';

-- 2. Borrar todas las fotos existentes (empezar desde cero)
DELETE FROM user_photos;

-- 3. Reasignar avatar_url por género con randomuser.me
WITH classified AS (
  SELECT id, first_name,
    CASE
      WHEN first_name IN ('Alba','Ana','Carmen','Clara','Elena','Irene','Laura','Lucía','María','Marta','Nuria','Paula','Sofía')
      THEN 'women' ELSE 'men'
    END AS gender
  FROM users
),
numbered AS (
  SELECT id, gender,
    (ROW_NUMBER() OVER (PARTITION BY gender ORDER BY first_name, id) - 1)::int AS idx
  FROM classified
)
UPDATE users u
SET avatar_url = 'https://randomuser.me/api/portraits/' || n.gender || '/' || n.idx || '.jpg'
FROM numbered n
WHERE u.id = n.id;

-- 4. Foto 0 = avatar (retrato coherente con género)
INSERT INTO user_photos (user_id, url, sort_order)
SELECT id, avatar_url, 0 FROM users;

-- 5. Fotos 1 y 2 = paisajes deterministas vía picsum (su pool excluye retratos de personas)
INSERT INTO user_photos (user_id, url, sort_order)
SELECT id, 'https://picsum.photos/seed/' || REPLACE(id::text, '-', '') || 'a/600/800', 1 FROM users
UNION ALL
SELECT id, 'https://picsum.photos/seed/' || REPLACE(id::text, '-', '') || 'b/600/800', 2 FROM users;

COMMIT;
