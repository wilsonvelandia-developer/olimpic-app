# Changelog — master

## [No publicado]

### Agregado

#### Setup y configuración inicial
- Se inicializó el proyecto Angular 21.x con standalone components, routing y CSS3
- Se configuró Angular CLI con analytics deshabilitado globalmente
- Se creó spec de requerimientos en `.kiro/specs/olimpic-app-frontend/requirements.md`
- Se pinnaron versiones exactas de dependencias en `package.json` (eliminados `^` y `~`)
- Se actualizó `.gitignore`: exclusiones para `.idea/`, `.env`, `.env.*`, archivos de sistema

#### Arquitectura base (Paso 2)
- Se definió estructura de carpetas por dominio: `core/`, `shared/`, `layout/`, `features/`
- Se crearon modelos TypeScript tipados: `Sport`, `Tournament`, `Team`, `Player`, `Match`, `ApiResponse`, `PaginatedResponse`
- Se implementó `ApiService` con wrappers tipados para GET, POST, PUT, PATCH, DELETE
- Se implementó `AuthService` con gestión de sesión via httpOnly cookies (sin localStorage)
- Se implementaron interceptores HTTP: `authInterceptor` (correlationId + withCredentials) y `errorInterceptor`
- Se implementó `authGuard` con Angular Signals para proteger rutas autenticadas
- Se creó layout Shell con Navbar y Sidebar colapsable (OnPush, signals)
- Se configuraron rutas lazy-loading para todos los feature modules
- Se definieron design tokens CSS en `styles.css` (colores, tipografía, espaciado, sombras, z-index)
- Se actualizó `app.config.ts` con `provideHttpClient`, interceptores y `withViewTransitions`

#### Módulo de Torneos (Paso 3)
- `TournamentService`: CRUD completo con filtros y paginación
- `TournamentList`: tabla con filtros por estado/temporada, paginación y confirmación de borrado
- `TournamentForm`: formulario reactivo con validación (required, minLength, pattern, cross-field dateRange)
- `TournamentDetail`: vista de detalle con info cards y breadcrumb
- Componentes shared: `StatusBadge`, `LoadingSpinner`, `ConfirmDialog`
- Estilos globales compartidos: `buttons.css`, `forms.css`, `tables.css`
- Rutas: `/tournaments`, `/tournaments/new`, `/tournaments/:id/edit`, `/tournaments/:id`

#### Módulo de Equipos (Paso 4)
- `TeamService`: CRUD con filtros por búsqueda y estado
- `TeamList`: tabla con logo/placeholder generado por iniciales, filtros, paginación
- `TeamForm`: formulario reactivo con validación de URL para logo
- `TeamDetail`: perfil del equipo con roster de jugadores y navegación a player-form
- Rutas: `/teams`, `/teams/new`, `/teams/:id/edit`, `/teams/:id`

#### Módulo de Jugadores (Paso 4)
- `PlayerService`: CRUD con filtros por equipo, búsqueda y estado
- `PlayerList`: tabla con dorsal, soporte de pre-filtro por `teamId` vía query params
- `PlayerForm`: formulario reactivo, pre-rellena `teamId` desde query param (flujo desde team-detail)
- `PlayerDetail`: perfil con cálculo de edad, avatar por iniciales y enlace al equipo
- Rutas: `/players`, `/players/new`, `/players/:id/edit`, `/players/:id`

#### Módulo de Partidos (Paso 5)
- `MatchService`: CRUD y endpoint dedicado para registro de resultados (`PATCH /result`)
- `MatchList`: tabla con marcador visual, chips de ronda, filtros por torneo/estado/ronda
- `MatchForm`: programar/editar partido, pre-rellena `tournamentId` por query param
- `MatchResult`: componente dedicado al registro del resultado con UI de marcador destacada
- Rutas: `/matches`, `/matches/new`, `/matches/:id/edit`, `/matches/:id/result`

#### Módulo de Deportes (Paso 5)
- `SportService`: CRUD del catálogo de deportes maestros
- `SportList`: grid de cards con icono, reglas, flags de prórroga/penales
- `SportForm`: formulario con sección de reglas configurables (scoringUnit, períodos, prórroga, penales) y auto-generación de slug
- `SportDetail`: detalle con todas las reglas del deporte
- Rutas: `/sports`, `/sports/new`, `/sports/:id/edit`, `/sports/:id`

#### Dashboard y Auth (Paso 6)
- `DashboardService`: 7 contadores en paralelo con `forkJoin`
- `Dashboard`: stat cards interactivas, torneos y partidos recientes, acciones rápidas
- `Login`: formulario reactivo, toggle de contraseña accesible, spinner inline, errores genéricos
- `sessionInitializer` (`APP_INITIALIZER`): restaura sesión desde cookie httpOnly al iniciar, silencia 401

#### Documentación y cierre (Paso 7)
- `README.md`: descripción, stack, arquitectura, tabla de endpoints, instrucciones de instalación/build/test
- Carpeta `postmanCollections/` creada con `.gitkeep`
- Repositorio commitado en estado limpio (0 archivos pendientes)
