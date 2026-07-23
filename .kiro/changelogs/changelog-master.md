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

#### Búsqueda global (Ctrl+K)
- Se creó componente `GlobalSearch` con modal, input con debounce 300ms, y resultados unificados
- Busca simultáneamente en torneos, equipos y jugadores con resultados rankeados
- Cada resultado muestra icono de tipo, título, subtítulo y navega al detalle al hacer click
- Integrado en navbar con botón 🔍 y atajo de teclado Esc para cerrar

#### PWA Offline (Service Worker)
- Se reescribió `sw.js` con estrategias diferenciadas: stale-while-revalidate (assets), network-first (API cacheable), network-only (mutations)
- APIs cacheables: tournaments, teams, matches, standings, sports, venues, announcements, gallery
- Respuesta offline con JSON genérico cuando no hay caché disponible
- Precache del app shell (index.html) para navegación offline

#### Calidad y UX — CI/CD
- Se creó `.github/workflows/ci.yml` para frontend: build production + check bundle size en cada PR
- Se creó `.github/workflows/ci.yml` para backend: build all + run migrations + test (venues, payments, announcements, matches) con Postgres 15 service

#### Calidad y UX — Docker
- Se creó `Dockerfile` para el gateway (multi-stage: builder + runner, node:20-alpine, USER node)
- Se creó `Dockerfile.service` genérico para todos los microservicios (build-args: SERVICE_NAME, SERVICE_PORT)

#### Calidad y UX — Responsive y Animaciones
- Tabs de tournament-detail: scroll-snap en mobile, scrollbar oculto, hover state en botones
- CSS micro-animaciones: card hover lift, button press (scale 0.97), dialog slide-up, skeleton shimmer, badge pop-in
- Page transitions con `slideUp` animation al cargar cada vista
- Focus rings con `:focus-visible` (2px solid primary, outline-offset 2px) — invisible en mouse
- Responsive breakpoints (768px): page headers stack, filters column, grids single-column, form grids single-column

#### Calidad y UX — Error Handling
- `errorInterceptor` mejorado: muestra toast global para errores 500 (error), 403 (warning), 422 (warning), 0 (offline)
- Silencia 401 (handled by auth) y 404 (handled by componente)
- Mensajes genéricos al usuario, detalles solo en `console.error`

#### Calidad y UX — Empty States y Skeletons
- Se creó componente `EmptyState` con SVG de clipboard + lupa, título, mensaje y botón CTA opcional
- Se conectó `Skeleton` (tipo card y table) en team-list como reemplazo de LoadingSpinner durante carga
- Skeleton con shimmer animation para feedback visual inmediato

#### Calidad y UX — Dark Mode Fixes
- Badges (success, warning, error, info) con colores adaptados para dark mode
- Alerts, cards, y drop-zone con border-color corregido en dark mode
- Form focus ring con opacidad reducida en dark mode

#### Compartir como imagen
- Se creó `ShareImageService` con html2canvas: captura, descarga, Web Share API (mobile), clipboard fallback
- Se creó componente `ShareButton` reutilizable que acepta un `targetRef` (HTMLElement) y genera PNG
- Soporte para escala 2x, CORS, y fondo blanco forzado

#### Analytics Dashboard (gráficas)
- Se creó componente `BarChart` (SVG, horizontal bars con labels y valores proporcionales)
- Se creó componente `DonutChart` (SVG, segmentos coloreados con leyenda y centro con total)
- Se creó `AnalyticsDashboard` con 3 gráficas: partidos por estado (donut), pagos por método (donut), partidos por ronda (bar)
- Ruta: `/dashboard/analytics` protegida con `organizer`

#### Búsqueda global (Ctrl+K)

#### Campana de notificaciones in-app
- Se creó componente `NotificationBell` con badge de no leídos y dropdown
- Polling cada 30s para actualizar conteo de no leídas
- Click en notificación marca como leída y navega a la entidad referenciada
- Botón "Marcar todas leídas" para limpiar el badge
- Integrado en navbar entre búsqueda y selector de idioma

#### Integración ImageUpload en formularios
- Se reemplazó el input de texto URL en `team-form` por `ImageUpload` con drag-drop (folder: `teams`)
- Se reemplazó el input de texto URL en `venue-form` por `ImageUpload` con drag-drop (folder: `venues`)
- Se reemplazó el input de texto URL en `gallery-form` por `ImageUpload` para portada (folder: `gallery`)
- Subida directa a Firebase Storage con progreso en tiempo real y preview instantáneo

#### Internacionalización (i18n)
- Se creó `I18nService` con soporte para español e inglés, persistencia en localStorage, detección del idioma del navegador
- Se crearon archivos de traducción `es.ts` y `en.ts` con 80+ keys cubriendo navegación, acciones, labels, auth, módulos y errores
- Se creó componente `LanguageSwitcher` para cambio de idioma desde el navbar
- Soporte para interpolación de parámetros en traducciones (`{{name}}`)

#### Onboarding / Tour interactivo
- Se creó `OnboardingService` con gestión de pasos, progresión, persistencia de completado
- 6 pasos predefinidos: navegación, dashboard, crear torneo, equipos, partidos, modo árbitro
- Se creó componente `OnboardingOverlay` con tooltip posicionado dinámicamente sobre elementos target
- Soporte para custom tours (pasos personalizados por contexto)
- Se detecta posición del elemento target vía `getBoundingClientRect` + scroll into view

#### Importación CSV/Excel de equipos y jugadores
- Se creó `CsvImportService` con parser CSV nativo (BOM, campos entrecomillados, newlines en quotes)
- Validación de archivo: tipo (csv/xlsx), tamaño máx. 2MB
- Parser de equipos: nombre, abreviatura, teléfono, email, variante (acepta headers en español e inglés)
- Parser de jugadores: nombre, dorsal (0-99), posición, documento, email, teléfono, fecha nacimiento
- Se creó componente `CsvImportDialog` reutilizable con preview, conteo de errores por fila, y confirmación

#### Chat en tiempo real (WebSocket)
- Se creó `ChatService` con Socket.IO: conexión, rooms, mensajes, envío, conteo de no leídos
- Soporte para rooms tipo `tournament`, `team`, `direct`
- Se creó componente `ChatPanel` con sidebar de conversaciones y área de mensajes
- Mensajes propios vs ajenos con estilos diferenciados
- Ruta `/chat` protegida con rol `organizer`+, agregada al sidebar

#### Tema personalizado por torneo
- Se creó `TournamentThemeService` para aplicar colores y branding custom en la vista pública
- Aplica CSS custom properties dinámicas (`--tournament-primary`, `--tournament-secondary`, `--tournament-primary-light`)
- Genera automáticamente versión light del color primario para fondos
- Método `resetTheme()` para restaurar al salir de la vista pública

#### Base de datos
- Se aplicaron migraciones 026-029: `venues`, `announcements`, `payments`, `gallery_photos`
- Tablas con UUID, FK con CASCADE, índices compuestos, constraints CHECK

#### Firebase Storage — Upload de imágenes
- Se creó `ImageUploadService` con upload a Firebase Storage, progreso en tiempo real y validación (5MB, JPG/PNG/WebP/GIF)
- Se creó componente `ImageUpload` reutilizable con drag-and-drop, preview instantáneo y barra de progreso
- Genera nombres únicos con timestamp + random para evitar colisiones en storage

#### Bracket visual de eliminatoria
- Se creó `TournamentBracket` que carga fases eliminatorias reales del backend
- Detecta automáticamente fases con formato `single_elim`/`double_elim`
- Mapea partidos a rondas (octavos, cuartos, semis, final) por conteo de matches
- Conecta con el componente shared `Bracket` existente para renderizado visual
- Soporte para partido por el 3er puesto separado
- Integrado como tab "Llaves" en tournament-detail

#### Sistema de sanciones
- Se creó `TournamentSanctions` con tabla de tarjetas amarillas/rojas y suspensiones
- Filtros por tipo: todas, amarillas, rojas, suspendidos
- Estadísticas resumen: total amarillas, total rojas, jugadores suspendidos
- Resaltado visual de filas de jugadores suspendidos
- Integrado como tab "Sanciones" en tournament-detail

#### Ranking de goleadores
- Se creó `TournamentScorers` con tabla de goleadores ordenada por goles
- Columnas: posición (medallas top 3), jugador, equipo, goles, asistencias, PJ, goles/partido
- Resaltado visual de los 3 primeros
- Integrado como tab "Goleadores" en tournament-detail

#### Swagger / OpenAPI
- Se instaló `swagger-ui-express@5.0.1` y `yaml@2.7.1` en el gateway
- Se creó `openapi.yaml` (OpenAPI 3.0.3) documentando todos los endpoints de los 10 servicios
- Se montó Swagger UI en `/api-docs` (público, sin autenticación)
- Build script del gateway copia el YAML a dist automáticamente

#### Tests unitarios (backend)
- Se crearon tests para venues schema: 20 tests (create, update, id, query validation)
- Se crearon tests para payments schema: 18 tests (amount format, status enum, UUIDs)
- Se crearon tests para announcements schema: 21 tests (priority enum, content, title)
- Total: 59 tests nuevos, todos passing con vitest 3.2.1

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

### Seguridad
- Se implementó auto-refresh de token en `authInterceptor`: ante 401, intenta `POST /auth/refresh` antes de redirigir a login
- Se evitan loops infinitos: no se reintenta refresh en endpoints de auth (login, refresh, logout)

### Agregado
- Se creó página `ForgotPassword` (`/auth/forgot-password`): formulario de email, prevención de enumeración (siempre muestra éxito), enlace desde login
- Se creó página `ResetPassword` (`/auth/reset-password`): acepta token por query param, formulario de nueva contraseña con confirmación, feedback de éxito/error
- Se agregaron métodos `refreshSession()`, `forgotPassword()` y `resetPassword()` en `AuthService`
- Se agregó enlace "¿Olvidaste tu contraseña?" en la página de login
- Se agregó manejo de respuesta 429 (brute-force lockout) en el componente de login con mensaje descriptivo

### Cambiado
- `auth.interceptor.ts`: reescrito con lógica de auto-refresh (switchMap al endpoint /auth/refresh) antes de redirigir a login
- `auth.routes.ts`: se agregaron rutas `/auth/forgot-password` y `/auth/reset-password`
- `login.ts`: se importó `RouterLink`, se agregó manejo de status 429
- `login.html`: se agregó sección de enlaces con link a forgot-password

### Cambiado
- `ApiService.getPaginated`: ahora lee `total`, `page` y `pageSize` directamente de la respuesta del backend (paginación real); mantiene fallback a `items.length` para endpoints legados que no devuelven metadatos de paginación
- `ApiService.getPaginated`: tipado mejorado con interfaz interna `PagedApiResponse<T>` que extiende `ApiResponse<T[]>` con campos opcionales de paginación

### Agregado
- Se creó componente `PlayerStatsComponent` (`player-stats/`): muestra estadísticas agregadas del jugador (goles, tarjetas, partidos, ratio victorias) en una grilla de stat-cards
- Se integró `PlayerStatsComponent` en `player-detail` como sección "Estadísticas"
- Se agregó método `getStats(teamId, playerId)` y interfaz `PlayerStats` en `PlayerService`

### Eliminado
- Se eliminó `push-notification.service.ts` (duplicado). Se conserva `push-notifications.service.ts` que es la versión completa con integración de ToastService y notificaciones locales

### Corregido
- `ApiService.getPaginated`: corregido error de TypeScript por mezcla de operadores `??` y `||` sin paréntesis

### Cambiado
- `errorInterceptor`: se agregó retry automático con exponential backoff (1s, 2s) para errores 5xx y network timeout en peticiones GET/HEAD — máximo 2 reintentos antes de mostrar el toast de error

### Agregado
- Se agregó skip-link "Saltar al contenido principal" en `shell.html` — visible solo con teclado (Tab), estilizado sobre la barra de navegación
- Se agregó `id="main-content"` y `aria-label="Contenido principal"` al `<main>` del shell
- Se implementó focus management en cambio de ruta: tras cada NavigationEnd, el foco se mueve al contenido principal (mejora la experiencia con screen readers y teclado)
- Se agregó CSS para `.skip-link` con posicionamiento absoluto y transición visible en `:focus`

### Agregado
- Se creó `GlobalErrorHandler` (`core/error-handler/global-error-handler.ts`): captura errores no manejados, previene crash total de la app, detecta chunk-load errors post-deploy y ofrece recargar
- Se registró `GlobalErrorHandler` como provider de `ErrorHandler` en `app.config.ts`

### Cambiado
- Formulario de inscripción pública (`public-enrollment`): se agregaron campos para Club/Organización, Escudo/Logo (URL), colores (primary/secondary con color picker), redes sociales (Instagram, Facebook, TikTok, YouTube), y email
- Hint informativo en campo Club: indica que si el club participa con varios equipos, debe usar el mismo nombre en cada inscripción

### Cambiado
- Formulario de inscripción de jugadores (`public-enrollment`): expandido con campos completos:
  - Tipo de documento (select: CC, TI, RC, CE, PA)
  - Número de documento (requerido)
  - Email, teléfono, fecha de nacimiento
  - Foto del jugador (URL)
  - Documento de identidad frente y reverso (URL foto/PDF)
  - Certificado EPS (URL foto/PDF)
  - Número de camiseta y posición
- Nota informativa: "Se creará una cuenta para cada jugador. La contraseña inicial será su número de documento."
- Cada jugador se presenta en una tarjeta individual (card layout) en vez de fila inline

### Agregado
- Se creó componente `ShareableLinks` en tournament-detail: muestra tarjetas con URLs copiables para "Torneo público", "Inscripción de equipos" y "Partidos en vivo". Botones de Copiar y Compartir (usa Web Share API en mobile, clipboard en desktop)
- Se integró `ShareableLinks` en la pestaña "Información" del detalle de torneo (visible solo para organizadores)
- Vista pública del torneo (`public-tournament-detail`): se agregaron botones "Inscribir equipo" y "Compartir" en el header para que espectadores puedan compartir el link o ir directamente a inscribirse

### Corregido
- `authInterceptor`: las rutas públicas (`/p/*`) ya no redirigen a login cuando reciben un 401 — se detecta la ruta actual y se deja pasar el error sin redirección
- `authInterceptor`: las peticiones a `/public/*` ya no envían cookies de autenticación (`withCredentials: false`) para evitar enviar sesión innecesaria
- `authInterceptor`: se excluye `/auth/me` de los intentos de refresh (la restauración de sesión silencia su propio 401 sin necesidad de refresh loop)

### Agregado
- Se creó página de aterrizaje (`/inicio`): hero con CTA, sección de features (6 cards), sección de planes con precios en COP (cargados desde API), sección CTA con botón de WhatsApp, y footer
- Se configuró ruta `/inicio` como landing pública (sin auth) y fallback `**` redirige a `/inicio`
- Los planes se cargan dinámicamente desde `GET /public/plans/available` (sin autenticación)
