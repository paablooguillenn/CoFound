# Arquitectura de CoFound

## 1. Visión general

CoFound se plantea como una arquitectura **cliente-servidor** con separación clara de responsabilidades:

- **Cliente móvil**: experiencia de usuario, sesión, navegación, consumo de API y presentación.
- **Servidor backend**: autenticación, reglas de negocio, matching y acceso a datos.
- **PostgreSQL**: persistencia relacional y base para futuras ampliaciones como mensajería.

## 2. Capas del backend

1. **Routes**: definen la API REST.
2. **Controllers**: traducen HTTP a casos de uso.
3. **Services**: concentran la lógica de negocio.
4. **Database**: acceso a PostgreSQL mediante `pg`.
5. **Middleware**: autenticación, errores y rutas no encontradas.

## 3. Capas de la app móvil

1. **Navigation**: flujos de autenticación y aplicación principal.
2. **Context**: estado global de autenticación.
3. **Services**: cliente HTTP y acceso a endpoints.
4. **Screens**: pantallas del MVP.
5. **Components**: piezas reutilizables.
6. **Theme**: colores y espaciado consistentes.

## 4. Flujo principal

1. El usuario se registra o inicia sesión.
2. El backend devuelve un JWT y el perfil básico.
3. La app guarda el token de forma persistente.
4. El usuario completa su perfil y habilidades.
5. La pantalla de exploración consulta perfiles compatibles.
6. Un `like` mutuo genera un `match`.
7. La lista de matches muestra las conexiones activas.

## 5. Escalabilidad prevista

- Tabla `messages` ya prevista en el esquema.
- Arquitectura preparada para añadir notificaciones, filtros y chats.
- Posibilidad de introducir recomendaciones avanzadas sin alterar la API pública principal.
