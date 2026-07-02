# Changelog — master

## [No publicado]

### Agregado

#### Módulo de Sedes (Venues)
- Se creó `venue.model.ts` con interfaces `Venue`, `VenueCreateRequest`, `VenueUpdateRequest` y tipo `VenueStatus`
- Se implementó `VenueService`: CRUD con filtros por búsqueda, ciudad y estado
- `VenueList`: grid/tabla con filtros, paginación, toggle de vista card/list, confirmación de borrado
- `VenueForm`: formulario reactivo con validación (nombre, dirección, ciudad requeridos), campos de contacto y mapa
- `VenueDetail`: vista de detalle con grilla de información, enlace a mapa y acciones de edición/eliminación
- Rutas: `/venues`, `/venues/new`, `/venues/:id/edit`, `/venues/:id`

#### Módulo de Pagos (Payments)
- Se creó `payment.model.ts` con interfaces `Payment`, `PaymentCreateRequest`, `PaymentUpdateRequest` y tipos `PaymentStatus`, `PaymentMethod`
- Se implementó `PaymentService`: CRUD con filtros por torneo, equipo y estado
- `PaymentList`: tabla con formato de moneda (Intl.NumberFormat), filtros por torneo/estado, paginación
- `PaymentForm`: formulario reactivo con selects de torneo/equipo (cargados desde API), validación de monto mínimo
- `PaymentDetail`: vista de detalle con monto destacado, estado, referencia, notas y fechas
- Rutas protegidas (organizer+): `/payments`, `/payments/new`, `/payments/:id/edit`, `/payments/:id`

#### Módulo de Comunicados (Announcements)
- Se creó `announcement.model.ts` con interfaces `Announcement`, `AnnouncementCreateRequest`, `AnnouncementUpdateRequest` y tipos `AnnouncementPriority`, `AnnouncementStatus`
- Se implementó `AnnouncementService`: CRUD con filtros por torneo, prioridad y estado
- `AnnouncementList`: cards con indicador de prioridad (dot coloreado), extracto de contenido, filtros
- `AnnouncementForm`: formulario reactivo con textarea para contenido, selects de prioridad/estado/torneo
- `AnnouncementDetail`: vista completa con imagen, contenido pre-wrap, footer con autor y fecha
- Rutas: `/announcements`, `/announcements/new`, `/announcements/:id/edit`, `/announcements/:id`

#### Módulo de Galería (Gallery)
- Se creó `gallery.model.ts` con interfaces `GalleryAlbum`, `GalleryItem`, `GalleryAlbumCreateRequest`, `GalleryAlbumUpdateRequest`, `GalleryItemCreateRequest` y tipo `GalleryItemType`
- Se implementó `GalleryService`: CRUD de álbumes + operaciones de items (fotos/videos) anidados
- `GalleryList`: grid visual de álbumes con portada, contador de items y acciones
- `GalleryForm`: formulario reactivo para crear/editar álbumes con torneo opcional
- `GalleryDetail`: vista de álbum con grid de fotos/videos, indicador de tipo video, eliminación por item
- Rutas: `/gallery`, `/gallery/new`, `/gallery/:id/edit`, `/gallery/:id`

### Cambiado
- Se actualizó `app.routes.ts` para registrar las 4 nuevas rutas lazy-loaded (venues, payments, announcements, gallery)
- Se actualizó `core/models/index.ts` para exportar los nuevos modelos
- Se integró tabs de Sedes, Pagos, Comunicados y Galería en `tournament-detail` con sub-componentes dedicados
- Se agregó ruta `/referee-management` para gestión de árbitros (organizer+)
- Se agregó ruta `/dashboard/organizer` para dashboard del organizador con métricas
- Se integró componente `TeamMatches` (historial de partidos) en `team-detail`
- Se instaló `jspdf@2.5.2` y `jspdf-autotable@3.8.4` como dependencias exactas

#### Integración tournament-detail
- Se creó `TournamentVenues`: tab sub-componente para sedes del torneo
- Se creó `TournamentPayments`: tab con resumen de recaudo, tabla de pagos y accesos rápidos
- Se creó `TournamentAnnouncements`: tab con comunicados del torneo, indicadores de prioridad
- Se creó `TournamentGallery`: tab con grid de álbumes del torneo
- Se registraron 4 nuevos tabs (Sedes, Pagos, Comunicados, Galería) en el tab-panel

#### Exportación PDF (jsPDF)
- Se creó `PdfExportService` con métodos: `exportMatchSheet`, `exportStandings`, `exportFixture`, `exportFixtureFromMatches`
- Planilla de partido: encabezado, datos del partido, nóminas local/visitante con columnas de goles/tarjetas, firmas
- Tabla de posiciones: formato landscape con datos de PJ/PG/PE/PP/GF/GC/DG/Pts
- Fixture: lista de partidos con ronda, fecha, hora, equipos y sede

#### Exportación CSV
- Se creó `CsvExportService` con métodos: `exportFixture`, `exportStandings`
- Soporte para BOM UTF-8 (compatibilidad con Excel), escape de campos con comas/comillas
- Descarga automática vía Blob API

#### Historial de partidos por equipo (#33)
- Se creó `TeamMatches` component con tabla de historial, resumen (V/E/D) y botones de exportación PDF/CSV
- Se integró en `team-detail` como sección debajo de jugadores
- Se implementó clasificación de resultados (victoria/empate/derrota) con colores

#### Gestión de árbitros (#21)
- Se creó `RefereeHistory` component con layout split (sidebar de lista + panel de asignaciones)
- Muestra lista de árbitros con contador de partidos e indicador de disponibilidad
- Panel de detalle con historial de asignaciones: fecha, equipos, torneo, rol, estado
- Ruta: `/referee-management` protegida con `organizer`

#### Dashboard del organizador (#22)
- Se creó `OrganizerDashboard` con grid de métricas (torneos, equipos, partidos, recaudo)
- Sección de últimos pagos y próximos partidos con acciones de navegación
- Carga paralela vía `forkJoin` para métricas en una sola petición
- Ruta: `/dashboard/organizer` protegida con `organizer`

#### Base de datos
- Se aplicaron migraciones 026-029: `venues`, `announcements`, `payments`, `gallery_photos`
- Tablas con UUID, FK con CASCADE, índices compuestos, constraints CHECK

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

#### Sistema de roles RBAC (Paso 8)
- Se creó `role.model.ts` con tipo `AppRole` (`admin | editor | viewer`) y jerarquía numérica
- Se amplió `AuthService` con computeds: `isAdmin`, `canEdit`, `isViewer`, `currentRole` y método `hasRole()`
- Se implementó `roleGuard` funcional — lee `route.data.requiredRole` y redirige a `/forbidden` si el rol es insuficiente
- Se creó directiva estructural `HasRoleDirective` (`*hasRole`) para control de visibilidad en templates
- Se implementó página `Forbidden` (403) con navegación de retorno
- Se actualizó `app.routes.ts`: `/sports` protegido con `admin`, rutas de escritura con `editor`
- Se actualizaron rutas de features con `roleGuard`: tournaments, teams, players, matches (new/edit requieren `editor`)
- Se actualizó `Sidebar` para filtrar ítems según el rol del usuario (Deportes solo para admins)
- Se actualizó `Navbar` con badge visual del rol (`admin` rojo, `editor` ámbar, `viewer` neutro)
- Se aplicó control de visibilidad en templates de detalle y listado: botones crear/editar requieren `editor`, eliminar requiere `admin`
- Build verificado: 0 errores, 0 warnings
- `README.md`: descripción, stack, arquitectura, tabla de endpoints, instrucciones de instalación/build/test
- Carpeta `postmanCollections/` creada con `.gitkeep`
- Repositorio commitado en estado limpio (0 archivos pendientes)
