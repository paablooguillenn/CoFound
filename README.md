# CoFound

Base funcional para el TFC de una plataforma mobile-first de networking emprendedor.

## Arquitectura general

- **Mobile app**: React Native + Expo + TypeScript + React Navigation.
- **Backend**: Node.js + Express + TypeScript + JWT.
- **Base de datos**: PostgreSQL con modelo relacional preparado para crecimiento.
- **Estructura**: monorepo simple con separación clara entre cliente y servidor.

## Estructura del proyecto

```text
cofound/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── theme/
│   │   └── types/
│   └── package.json
└── docs/
```

## Puesta en marcha

### 1. Backend

1. Copia [backend/.env.example](backend/.env.example) a `backend/.env`.
2. Crea la base de datos PostgreSQL.
3. Ejecuta el esquema de [backend/src/db/schema.sql](backend/src/db/schema.sql).
4. Instala dependencias con `npm install` en la raíz.
5. Inicia el backend con `npm run dev:backend`.

### 2. App móvil

1. Copia [mobile/.env.example](mobile/.env.example) a `mobile/.env` si deseas gestionar la URL externamente.
2. Ajusta la URL del backend en [mobile/src/services/api.ts](mobile/src/services/api.ts).
3. Inicia Expo con `npm run dev:mobile`.

## Endpoints incluidos

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile/me`
- `PUT /api/profile/me`
- `GET /api/discovery`
- `POST /api/matches/like`
- `GET /api/matches`

## Documentación adicional

- Arquitectura: [docs/architecture.md](docs/architecture.md)
- Modelo relacional: [backend/src/db/schema.sql](backend/src/db/schema.sql)
