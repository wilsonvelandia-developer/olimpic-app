# Changelog — master

## [No publicado]

### Agregado
- Se inicializó el proyecto Angular 21.x con standalone components, routing y CSS3
- Se configuró Angular CLI con analytics deshabilitado
- Se creó spec de requerimientos del frontend en `.kiro/specs/olimpic-app-frontend/requirements.md`
- Se pinnaron versiones exactas de todas las dependencias en `package.json` (eliminados `^` y `~`)
- Se actualizó `.gitignore` para incluir exclusiones requeridas: `.idea/`, `.env`, `.env.*`, archivos de sistema
- Se implementó módulo de Torneos completo con lazy loading:
  - `TournamentService`: operaciones CRUD contra la API REST
  - `TournamentList`: tabla con filtros por estado/temporada, paginación y acciones de editar/eliminar
  - `TournamentForm`: formulario reactivo con validación (required, minLength, pattern, cross-field dateRange)
  - `TournamentDetail`: vista de detalle con metadata, cards informativas y breadcrumb
- Se crearon componentes shared reutilizables: `StatusBadge`, `LoadingSpinner`, `ConfirmDialog`
- Se agregaron estilos globales compartidos: `buttons.css`, `forms.css`, `tables.css`
- Rutas de torneos ampliadas: `/tournaments`, `/tournaments/new`, `/tournaments/:id/edit`, `/tournaments/:id`
- Se crearon modelos TypeScript tipados para: Sport, Tournament, Team, Player, Match, ApiResponse
- Se implementó `ApiService` base con wrappers tipados para GET, POST, PUT, PATCH, DELETE
- Se implementó `AuthService` con gestión de sesión via httpOnly cookies (sin localStorage)
- Se implementaron interceptores HTTP: `authInterceptor` (correlationId + withCredentials) y `errorInterceptor`
- Se implementó `authGuard` con Angular Signals para proteger rutas autenticadas
- Se creó layout Shell con Navbar y Sidebar colapsable
- Se configuraron rutas lazy-loading para todos los feature modules: dashboard, tournaments, teams, players, matches, sports, auth
- Se definieron design tokens CSS en `styles.css` (colores, tipografía, espaciado, sombras)
- Se actualizó `app.config.ts` con `provideHttpClient`, interceptores y `withViewTransitions`
- Build verificado exitosamente: 0 errores, lazy chunks generados correctamente
