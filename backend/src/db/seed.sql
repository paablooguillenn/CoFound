-- Seed data: 30 usuarios de prueba para CoFound
-- Contraseña para todos: "password123" (bcrypt hash)
-- Ejecutar: psql -U postgres -d cofound -f seed.sql

-- Limpiar datos previos en orden correcto (respetando foreign keys)
DELETE FROM messages;
DELETE FROM matches;
DELETE FROM user_likes;
DELETE FROM user_photos;
DELETE FROM user_skills;
DELETE FROM users WHERE email LIKE '%@cofound-seed.com';

-- Añadir columnas si no existen
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Crear tabla user_photos si no existe
CREATE TABLE IF NOT EXISTS user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SKILLS (18 habilidades)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO skills (id, name, category) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'React', 'Desarrollo'),
  ('b0000000-0000-0000-0000-000000000002', 'Node.js', 'Desarrollo'),
  ('b0000000-0000-0000-0000-000000000003', 'Python', 'Desarrollo'),
  ('b0000000-0000-0000-0000-000000000004', 'Marketing Digital', 'Marketing'),
  ('b0000000-0000-0000-0000-000000000005', 'SEO/SEM', 'Marketing'),
  ('b0000000-0000-0000-0000-000000000006', 'Diseño UX/UI', 'Diseño'),
  ('b0000000-0000-0000-0000-000000000007', 'Figma', 'Diseño'),
  ('b0000000-0000-0000-0000-000000000008', 'Finanzas', 'Negocio'),
  ('b0000000-0000-0000-0000-000000000009', 'Ventas', 'Negocio'),
  ('b0000000-0000-0000-0000-000000000010', 'Machine Learning', 'Datos'),
  ('b0000000-0000-0000-0000-000000000011', 'Data Analysis', 'Datos'),
  ('b0000000-0000-0000-0000-000000000012', 'Growth Hacking', 'Marketing'),
  ('b0000000-0000-0000-0000-000000000013', 'Product Management', 'Producto'),
  ('b0000000-0000-0000-0000-000000000014', 'Branding', 'Diseño'),
  ('b0000000-0000-0000-0000-000000000015', 'React Native', 'Desarrollo'),
  ('b0000000-0000-0000-0000-000000000016', 'PostgreSQL', 'Desarrollo'),
  ('b0000000-0000-0000-0000-000000000017', 'Blockchain', 'Tecnología'),
  ('b0000000-0000-0000-0000-000000000018', 'Copywriting', 'Marketing')
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 30 USUARIOS SEED
-- ═══════════════════════════════════════════════════════════════════════════
-- Fotos: foto 1 = retrato coherente con género, fotos 2-3 = paisajes/objetos
-- Unsplash photos con IDs fijos para que sean siempre las mismas

INSERT INTO users (id, email, password_hash, first_name, last_name, avatar_url, bio, interests, location) VALUES
-- 1. Mujeres (15)
('a0000000-0000-0000-0000-000000000001', 'maria.gonzalez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'María', 'González',
 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop&crop=face',
 'Emprendedora apasionada por la sostenibilidad y el impacto social. Fundadora de una startup de moda circular. Busco cofundador/a técnico.',
 'Sostenibilidad, E-commerce, Moda, Impacto social', 'Madrid, España'),

('a0000000-0000-0000-0000-000000000003', 'laura.sanchez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Laura', 'Sánchez',
 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop&crop=face',
 'Especialista en marketing digital y growth hacking. He escalado 3 startups de 0 a 100k usuarios.',
 'Marketing Digital, Growth, Redes Sociales, Contenido', 'Valencia, España'),

('a0000000-0000-0000-0000-000000000005', 'elena.martinez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Elena', 'Martínez',
 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face',
 'MBA y experiencia en venture capital. Apasionada por el fintech y los modelos de negocio disruptivos.',
 'Fintech, Venture Capital, Modelos de negocio, Blockchain', 'Bilbao, España'),

('a0000000-0000-0000-0000-000000000007', 'sofia.herrera@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Sofía', 'Herrera',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&crop=face',
 'Diseñadora de producto con 6 años en startups tech. Creo interfaces que los usuarios aman.',
 'Producto, Diseño, Startups, UX Research', 'Barcelona, España'),

('a0000000-0000-0000-0000-000000000008', 'carmen.navarro@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Carmen', 'Navarro',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&crop=face',
 'Ingeniera de software en Google. Quiero emprender en edtech. Busco cofundador/a con visión de negocio.',
 'Educación, Tecnología, SaaS, IA', 'Madrid, España'),

('a0000000-0000-0000-0000-000000000009', 'lucia.romero@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Lucía', 'Romero',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&crop=face',
 'Consultora estratégica con background en BCG. Busco proyectos tech con impacto en salud.',
 'Consultoría, Estrategia, Salud, Negocios', 'Sevilla, España'),

('a0000000-0000-0000-0000-000000000010', 'paula.jimenez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Paula', 'Jiménez',
 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=face',
 'Content creator y especialista en branding. He construido marcas con +500k seguidores orgánicos.',
 'Branding, Contenido, Redes Sociales, Comunicación', 'Málaga, España'),

('a0000000-0000-0000-0000-000000000011', 'ana.moreno@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Ana', 'Moreno',
 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop&crop=face',
 'Data scientist con PhD en estadística. Quiero aplicar ML a problemas reales de sostenibilidad.',
 'Data Science, ML, Sostenibilidad, Investigación', 'Granada, España'),

('a0000000-0000-0000-0000-000000000012', 'andrea.castro@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Andrea', 'Castro',
 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&crop=face',
 'Abogada especializada en startups y propiedad intelectual. Asesoro y quiero cofundar.',
 'Legal, Startups, Propiedad Intelectual, Regulación', 'Madrid, España'),

('a0000000-0000-0000-0000-000000000013', 'irene.gil@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Irene', 'Gil',
 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&crop=face',
 'Product manager en Spotify. Busco equipo para lanzar una app de bienestar mental.',
 'Producto, Salud Mental, Apps, Crecimiento', 'Barcelona, España'),

('a0000000-0000-0000-0000-000000000014', 'clara.vega@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Clara', 'Vega',
 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&crop=face',
 'Experta en growth y adquisición de usuarios. He llevado 2 apps al top 10 de App Store.',
 'Growth, Adquisición, Mobile, Métricas', 'Valencia, España'),

('a0000000-0000-0000-0000-000000000015', 'marta.prieto@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Marta', 'Prieto',
 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop&crop=face',
 'Arquitecta reconvertida a UX designer. Combino diseño espacial con experiencias digitales únicas.',
 'UX/UI, Arquitectura, Diseño, Innovación', 'Bilbao, España'),

('a0000000-0000-0000-0000-000000000016', 'nuria.blanco@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Nuria', 'Blanco',
 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&crop=face',
 'Especialista en e-commerce con 8 años de experiencia. He facturado +2M en marketplaces.',
 'E-commerce, Marketplaces, Logística, Ventas', 'Zaragoza, España'),

('a0000000-0000-0000-0000-000000000017', 'alba.serrano@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Alba', 'Serrano',
 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=600&h=800&fit=crop&crop=face',
 'Periodista y comunicadora digital. Quiero crear una plataforma de noticias con IA.',
 'Comunicación, Periodismo, IA, Media', 'Sevilla, España'),

('a0000000-0000-0000-0000-000000000018', 'rocio.molina@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Rocío', 'Molina',
 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600&h=800&fit=crop&crop=face',
 'Nutricionista y emprendedora. Desarrollo una app de alimentación personalizada con IA.',
 'Salud, Nutrición, Apps, Bienestar', 'Málaga, España'),

-- 2. Hombres (15)
('a0000000-0000-0000-0000-000000000002', 'carlos.ruiz@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Carlos', 'Ruiz',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face',
 'Full-stack developer con 5 años de experiencia. Me encanta crear productos digitales desde cero.',
 'Tecnología, SaaS, Startups, Inteligencia Artificial', 'Barcelona, España'),

('a0000000-0000-0000-0000-000000000004', 'javier.lopez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Javier', 'López',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&crop=face',
 'Diseñador UX/UI con background en psicología. Creo experiencias digitales que enamoran.',
 'Diseño, UX/UI, Producto, Psicología del usuario', 'Sevilla, España'),

('a0000000-0000-0000-0000-000000000006', 'daniel.fernandez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Daniel', 'Fernández',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop&crop=face',
 'Data scientist y ML engineer. He trabajado en Amazon y en startups de healthtech.',
 'Inteligencia Artificial, Salud, Data Science, Machine Learning', 'Málaga, España'),

('a0000000-0000-0000-0000-000000000019', 'pablo.ruiz@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Pablo', 'Ruiz',
 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=face',
 'CTO de una fintech en crecimiento. Experto en arquitectura cloud y sistemas escalables.',
 'Cloud, Fintech, Arquitectura, DevOps', 'Madrid, España'),

('a0000000-0000-0000-0000-000000000020', 'adrian.torres@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Adrián', 'Torres',
 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop&crop=face',
 'Emprendedor serial. He fundado y vendido 2 startups SaaS. Busco mi próximo proyecto.',
 'SaaS, Emprendimiento, Ventas, Estrategia', 'Barcelona, España'),

('a0000000-0000-0000-0000-000000000021', 'marcos.diaz@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Marcos', 'Díaz',
 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop&crop=face',
 'Ingeniero de IA en computer vision. Quiero aplicar ML al sector agrícola.',
 'IA, Computer Vision, AgriTech, Deep Learning', 'Granada, España'),

('a0000000-0000-0000-0000-000000000022', 'sergio.martin@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Sergio', 'Martín',
 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop&crop=face',
 'Growth marketer con experiencia en scale-ups. He gestionado budgets de +1M en paid media.',
 'Growth, Paid Media, Analytics, Performance', 'Valencia, España'),

('a0000000-0000-0000-0000-000000000023', 'diego.santos@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Diego', 'Santos',
 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=600&h=800&fit=crop&crop=face',
 'Blockchain developer y crypto enthusiast. Construyo dApps y smart contracts en Solidity.',
 'Blockchain, Web3, DeFi, Smart Contracts', 'Bilbao, España'),

('a0000000-0000-0000-0000-000000000024', 'raul.ortega@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Raúl', 'Ortega',
 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=600&h=800&fit=crop&crop=face',
 'Product manager con 8 años en empresas tech. Quiero lanzar una herramienta de productividad.',
 'Producto, Productividad, SaaS, Gestión', 'Madrid, España'),

('a0000000-0000-0000-0000-000000000025', 'alex.guerrero@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Álex', 'Guerrero',
 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&h=800&fit=crop&crop=face',
 'Diseñador industrial reconvertido a product designer. Combino hardware y software.',
 'Diseño Industrial, Producto, IoT, Hardware', 'Zaragoza, España'),

('a0000000-0000-0000-0000-000000000026', 'miguel.ramos@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Miguel', 'Ramos',
 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop&crop=face',
 'Experto en ventas B2B y partnerships. He cerrado acuerdos con Fortune 500.',
 'Ventas B2B, Partnerships, Negocios, Networking', 'Barcelona, España'),

('a0000000-0000-0000-0000-000000000027', 'ivan.fuentes@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Iván', 'Fuentes',
 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=600&h=800&fit=crop&crop=face',
 'Backend engineer experto en microservicios y Kubernetes. Busco proyecto ambicioso.',
 'Backend, Microservicios, Kubernetes, Go', 'Sevilla, España'),

('a0000000-0000-0000-0000-000000000028', 'hugo.mendez@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Hugo', 'Méndez',
 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=600&h=800&fit=crop&crop=face',
 'CFO freelance para startups. He ayudado a levantar +5M en rondas de inversión.',
 'Finanzas, Inversión, Fundraising, Startups', 'Madrid, España'),

('a0000000-0000-0000-0000-000000000029', 'oscar.silva@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Óscar', 'Silva',
 'https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=600&h=800&fit=crop&crop=face',
 'Desarrollador mobile con apps publicadas con +100k descargas. React Native y Swift.',
 'Mobile, React Native, Swift, Apps', 'Málaga, España'),

('a0000000-0000-0000-0000-000000000030', 'victor.reyes@cofound-seed.com',
 '$2b$10$yfsEEpA16BCpDY.tFacvA.4giC.ykUudkeIHXA26HCCJafhgjTDSi',
 'Víctor', 'Reyes',
 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop&crop=face',
 'DevOps y cloud architect. Automatizo todo lo que puedo. AWS, Terraform, CI/CD.',
 'DevOps, Cloud, Automatización, Infraestructura', 'Valencia, España')

ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  interests = EXCLUDED.interests,
  location = EXCLUDED.location;

-- ═══════════════════════════════════════════════════════════════════════════
-- FOTOS (3 por usuario: retrato + 2 paisajes/objetos)
-- ═══════════════════════════════════════════════════════════════════════════

-- Paisajes y objetos reutilizables
-- L1: Oficina moderna   L2: Ciudad nocturna    L3: Naturaleza montaña
-- L4: Café con portátil  L5: Escritorio tech    L6: Playa atardecer
-- L7: Coworking          L8: Skyline urbano     L9: Bosque niebla
-- L10: Libros escritorio

DELETE FROM user_photos WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@cofound-seed.com'
);

INSERT INTO user_photos (user_id, url, sort_order) VALUES
-- María González
('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop', 2),
-- Laura Sánchez
('a0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=800&fit=crop', 2),
-- Elena Martínez
('a0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=800&fit=crop', 2),
-- Sofía Herrera
('a0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=800&fit=crop', 2),
-- Carmen Navarro
('a0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=800&fit=crop', 2),
-- Lucía Romero
('a0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=600&h=800&fit=crop', 2),
-- Paula Jiménez
('a0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=800&fit=crop', 2),
-- Ana Moreno
('a0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&h=800&fit=crop', 2),
-- Andrea Castro
('a0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=800&fit=crop', 2),
-- Irene Gil
('a0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?w=600&h=800&fit=crop', 2),
-- Clara Vega
('a0000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=800&fit=crop', 2),
-- Marta Prieto
('a0000000-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=800&fit=crop', 2),
-- Nuria Blanco
('a0000000-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=800&fit=crop', 2),
-- Alba Serrano
('a0000000-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=600&h=800&fit=crop', 2),
-- Rocío Molina
('a0000000-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=800&fit=crop', 2),
-- Carlos Ruiz
('a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop', 2),
-- Javier López
('a0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=800&fit=crop', 2),
-- Daniel Fernández
('a0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=800&fit=crop', 2),
-- Pablo Ruiz
('a0000000-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=800&fit=crop', 2),
-- Adrián Torres
('a0000000-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=600&h=800&fit=crop', 2),
-- Marcos Díaz
('a0000000-0000-0000-0000-000000000021', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000021', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000021', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=800&fit=crop', 2),
-- Sergio Martín
('a0000000-0000-0000-0000-000000000022', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000022', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000022', 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&h=800&fit=crop', 2),
-- Diego Santos
('a0000000-0000-0000-0000-000000000023', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000023', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000023', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=800&fit=crop', 2),
-- Raúl Ortega
('a0000000-0000-0000-0000-000000000024', 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000024', 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000024', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=800&fit=crop', 2),
-- Álex Guerrero
('a0000000-0000-0000-0000-000000000025', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000025', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000025', 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=800&fit=crop', 2),
-- Miguel Ramos
('a0000000-0000-0000-0000-000000000026', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000026', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000026', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=800&fit=crop', 2),
-- Iván Fuentes
('a0000000-0000-0000-0000-000000000027', 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000027', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000027', 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=600&h=800&fit=crop', 2),
-- Hugo Méndez
('a0000000-0000-0000-0000-000000000028', 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000028', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000028', 'https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?w=600&h=800&fit=crop', 2),
-- Óscar Silva
('a0000000-0000-0000-0000-000000000029', 'https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000029', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000029', 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=800&fit=crop', 2),
-- Víctor Reyes
('a0000000-0000-0000-0000-000000000030', 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop&crop=face', 0),
('a0000000-0000-0000-0000-000000000030', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop', 1),
('a0000000-0000-0000-0000-000000000030', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=800&fit=crop', 2);

-- ═══════════════════════════════════════════════════════════════════════════
-- USER SKILLS (offer = lo que saben, learn = lo que quieren aprender)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO user_skills (user_id, skill_id, skill_type) VALUES
-- María: ofrece ventas/branding/marketing, quiere react/node/RN
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000014', 'offer'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'learn'),
-- Carlos: ofrece React/Node/RN/Postgres, quiere marketing/ventas/PM
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'offer'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'offer'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000015', 'offer'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'learn'),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', 'learn'),
-- Laura: ofrece marketing/growth/SEO/copy, quiere python/data/UX
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000012', 'offer'),
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'offer'),
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'learn'),
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'learn'),
-- Javier: ofrece UX/Figma/Branding, quiere React/PM/Growth
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006', 'offer'),
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007', 'offer'),
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000014', 'offer'),
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000012', 'learn'),
-- Elena: ofrece finanzas/ventas/PM, quiere React/Python/Blockchain
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000008', 'offer'),
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000013', 'offer'),
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000017', 'learn'),
-- Daniel: ofrece Python/ML/Data, quiere UX/Marketing/Ventas
('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'offer'),
('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000010', 'offer'),
('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000011', 'offer'),
('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'learn'),
('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'learn'),
-- Sofía: ofrece UX/Figma/PM, quiere React/Python
('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'offer'),
('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'offer'),
('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000013', 'offer'),
('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'learn'),
-- Carmen: ofrece React/Node/Python, quiere Finanzas/Ventas
('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'offer'),
('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', 'offer'),
('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'offer'),
('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'learn'),
('a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000009', 'learn'),
-- Lucía: ofrece Finanzas/PM, quiere React/ML
('a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000008', 'offer'),
('a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000013', 'offer'),
('a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000010', 'learn'),
-- Paula: ofrece Branding/Copy/Marketing, quiere Data/Python
('a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000014', 'offer'),
('a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000018', 'offer'),
('a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000011', 'learn'),
('a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000003', 'learn'),
-- Ana: ofrece Python/ML/Data, quiere Marketing/Branding
('a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'offer'),
('a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000010', 'offer'),
('a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'offer'),
('a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000004', 'learn'),
('a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000014', 'learn'),
-- Andrea: ofrece Ventas/Finanzas, quiere React/UX
('a0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000008', 'offer'),
('a0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006', 'learn'),
-- Irene: ofrece PM/Growth, quiere Python/Node
('a0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000013', 'offer'),
('a0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000012', 'offer'),
('a0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'learn'),
('a0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 'learn'),
-- Clara: ofrece Growth/Marketing/SEO, quiere React/Figma
('a0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000012', 'offer'),
('a0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000005', 'offer'),
('a0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000007', 'learn'),
-- Marta: ofrece UX/Figma, quiere Node/React Native
('a0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000006', 'offer'),
('a0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000007', 'offer'),
('a0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000002', 'learn'),
('a0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000015', 'learn'),
-- Nuria: ofrece Ventas/Marketing, quiere React/Data
('a0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000011', 'learn'),
-- Alba: ofrece Copy/Marketing, quiere Python/ML
('a0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000018', 'offer'),
('a0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000003', 'learn'),
('a0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000010', 'learn'),
-- Rocío: ofrece Branding/Ventas, quiere React/Node
('a0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000014', 'offer'),
('a0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000002', 'learn'),
-- Pablo: ofrece React/Node/PostgreSQL, quiere Finanzas/Marketing
('a0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000001', 'offer'),
('a0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000002', 'offer'),
('a0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000016', 'offer'),
('a0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000008', 'learn'),
('a0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000004', 'learn'),
-- Adrián: ofrece Ventas/PM/Growth, quiere React/Python
('a0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000013', 'offer'),
('a0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000012', 'offer'),
('a0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000003', 'learn'),
-- Marcos: ofrece Python/ML, quiere Marketing/Ventas
('a0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000003', 'offer'),
('a0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000010', 'offer'),
('a0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000004', 'learn'),
('a0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000009', 'learn'),
-- Sergio: ofrece Marketing/Growth/SEO, quiere React/Node
('a0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000012', 'offer'),
('a0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000005', 'offer'),
('a0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000002', 'learn'),
-- Diego: ofrece Blockchain/React, quiere Finanzas/PM
('a0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000017', 'offer'),
('a0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000001', 'offer'),
('a0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000008', 'learn'),
('a0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000013', 'learn'),
-- Raúl: ofrece PM/Finanzas, quiere React/Python
('a0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000013', 'offer'),
('a0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000008', 'offer'),
('a0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000003', 'learn'),
-- Álex: ofrece UX/Figma/Branding, quiere Node/React Native
('a0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000006', 'offer'),
('a0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000007', 'offer'),
('a0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000014', 'offer'),
('a0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000002', 'learn'),
('a0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000015', 'learn'),
-- Miguel: ofrece Ventas/Marketing, quiere React/Blockchain
('a0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000004', 'offer'),
('a0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000017', 'learn'),
-- Iván: ofrece React/Node/PostgreSQL, quiere UX/Marketing
('a0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000001', 'offer'),
('a0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000002', 'offer'),
('a0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000016', 'offer'),
('a0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000006', 'learn'),
('a0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000004', 'learn'),
-- Hugo: ofrece Finanzas/Ventas, quiere React/ML
('a0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000008', 'offer'),
('a0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000009', 'offer'),
('a0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000001', 'learn'),
('a0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000010', 'learn'),
-- Óscar: ofrece React Native/React/Node, quiere Marketing/Finanzas
('a0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000015', 'offer'),
('a0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000001', 'offer'),
('a0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000002', 'offer'),
('a0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000004', 'learn'),
('a0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000008', 'learn'),
-- Víctor: ofrece Node/PostgreSQL/Python, quiere UX/PM
('a0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000002', 'offer'),
('a0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000016', 'offer'),
('a0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000003', 'offer'),
('a0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000006', 'learn'),
('a0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000013', 'learn')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Algunos likes cruzados para generar matches de prueba
-- ═══════════════════════════════════════════════════════════════════════════

-- María y Carlos se dan like mutuamente → match
INSERT INTO user_likes (sender_id, receiver_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO matches (user_a_id, user_b_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Laura y Javier se dan like mutuamente → match
INSERT INTO user_likes (sender_id, receiver_id) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004'),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO matches (user_a_id, user_b_id) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Sofía y Daniel se dan like mutuamente → match
INSERT INTO user_likes (sender_id, receiver_id) VALUES
  ('a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000006'),
  ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;

INSERT INTO matches (user_a_id, user_b_id) VALUES
  ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;
