# Tests E2E con Maestro

Suite de tests *end-to-end* para CoFound, escrita en YAML declarativo con
[Maestro](https://maestro.mobile.dev/).

## Prerrequisitos

1. **Maestro CLI** instalado:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. **App instalada** en un emulador Android o simulador iOS:
   ```bash
   cd mobile
   npx expo run:android   # o run:ios
   ```
3. **Backend corriendo** (Railway o local en `http://localhost:4000`).

## Ejecutar todos los flujos

```bash
maestro test .maestro/
```

## Ejecutar uno solo

```bash
maestro test .maestro/02_swipe_match_and_chat.yaml
```

## Flujos cubiertos

| Archivo | Qué prueba | Tags |
|---------|------------|------|
| `01_register_and_login.yaml` | Welcome → Registro → llega a verificación de email | `smoke`, `auth` |
| `02_swipe_match_and_chat.yaml` | Login → swipe a la derecha → modal de conexión → chat | `smoke`, `core` |
| `03_premium_demo_checkout.yaml` | Perfil → Pricing → Checkout demo → Success | `smoke`, `premium` |

## Datos de prueba esperados

Los flujos asumen que existe el seed user `pablo.test@cofound-seed.com` con
contraseña `password123`. Esto se cumple si los seeds están aplicados (ver
`backend/src/db/seed.sql` y el bootstrap automático en `runMigrations.ts`).
