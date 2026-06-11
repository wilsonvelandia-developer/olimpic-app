# OlimpicApp — Frontend

Plataforma web para la gestión y administración de torneos deportivos multideporte (fútbol, voleibol, baloncesto, tenis y otros).

## Descripción

OlimpicApp permite a los administradores gestionar torneos, equipos, jugadores y partidos desde una interfaz web responsiva. El sistema está diseñado para ser escalable: cualquier deporte puede configurarse sin modificar el código base, definiendo sus reglas (unidad de marcador, períodos, prórroga, penales) a través del catálogo de deportes.

## API Path

El frontend consume microservicios REST en Node.js:

```
Base URL (desarrollo): http://localhost:3000/api/v1
Base URL (producción): /api/v1
```

Endpoints principales:

| Recurso      | Path                        |
|--------------|-----------------------------|
| Auth         | `/api/v1/auth`              |
| Torneos      | `/api/v1/tournaments`       |
| Equipos      | `/api/v1/teams`             |
| Jugadores    | `/api/v1/players`           |
| Partidos     | `/api/v1/matches`           |
| Deportes     | `/api/v1/sports`            |
| Dashboard    | `/api/v1/tournaments`, `/api/v1/matches`, etc. (agregado en frontend) |

## Construido con

| Tecnología         | Versión  | Uso                              |
|--------------------|----------|----------------------------------|
| Angular            | 21.1.0   | Framework principal              |
| TypeScript         | 5.9.2    | Lenguaje con tipado estricto     |
| RxJS               | 7.8.0    | Reactividad y composición HTTP   |
| Angular Router     | 21.1.0   | Navegación con lazy loading      |
| Angular Forms      | 21.1.0   | Reactive Forms con validación    |
| Angular HttpClient | 21.1.0   | Comunicación con la API          |
| CSS3               | —        | Estilos con custom properties    |
| Vitest             | 4.0.8    | Testing unitario                 |
| Angular CLI        | 21.1.2   | Build, serve y scaffolding       |
| Node.js            | 24.x     | Runtime de desarrollo            |
| npm                | 11.x     | Gestor de paquetes               |

## Endpoints del frontend (rutas SPA)

| Ruta                         | Descripción                            |
|------------------------------|----------------------------------------|
| `/auth/login`                | Inicio de sesión                       |
| `/dashboard`                 | Panel de estadísticas generales        |
| `/tournaments`               | Listado de torneos                     |
| `/tournaments/new`           | Crear torneo                           |
| `/tournaments/:id`           | Detalle del torneo                     |
| `/tournaments/:id/edit`      | Editar torneo                          |
| `/teams`                     | Listado de equipos                     |
| `/teams/new`                 | Crear equipo                           |
| `/teams/:id`                 | Detalle del equipo con roster          |
| `/teams/:id/edit`            | Editar equipo                          |
| `/players`                   | Listado de jugadores                   |
| `/players/new`               | Registrar jugador                      |
| `/players/:id`               | Perfil del jugador                     |
| `/players/:id/edit`          | Editar jugador                         |
| `/matches`                   | Listado de partidos                    |
| `/matches/new`               | Programar partido                      |
| `/matches/:id/result`        | Registrar resultado de partido         |
| `/sports`                    | Catálogo de deportes                   |
| `/sports/new`                | Crear deporte                          |
| `/sports/:id`                | Detalle del deporte                    |
| `/sports/:id/edit`           | Editar reglas del deporte              |

## Arquitectura

```
src/app/
├── core/                   # Singleton: servicios, interceptores, guards, modelos
│   ├── models/             # Interfaces TypeScript tipadas
│   ├── services/           # ApiService, AuthService
│   ├── interceptors/       # authInterceptor (cookies + correlationId), errorInterceptor
│   ├── guards/             # authGuard (Signal-based)
│   └── initializers/       # sessionInitializer (APP_INITIALIZER)
├── shared/                 # Reutilizables cross-feature
│   ├── components/         # StatusBadge, LoadingSpinner, ConfirmDialog
│   └── styles/             # buttons.css, forms.css, tables.css
├── layout/                 # Shell, Navbar, Sidebar
└── features/               # Módulos lazy por dominio
    ├── auth/               # Login
    ├── dashboard/          # Estadísticas + actividad reciente
    ├── tournaments/        # CRUD completo
    ├── teams/              # CRUD + roster de jugadores
    ├── players/            # CRUD + perfil
    ├── matches/            # CRUD + registro de resultados
    └── sports/             # Catálogo con reglas configurables
```

**Decisiones de arquitectura:**
- **Standalone components** — sin NgModules, Angular 17+ style
- **Lazy loading** en todos los feature modules — cada uno genera su propio chunk JS
- **OnPush change detection** en todos los componentes
- **Angular Signals** para estado reactivo local (`signal`, `computed`)
- **JWT via httpOnly cookies** — ningún token en `localStorage`
- **APP_INITIALIZER** restaura la sesión al iniciar, antes de renderizar rutas
- **Design tokens CSS** con custom properties en `styles.css`

## Requisitos previos

- Node.js 20.x LTS o superior
- npm 10.x o superior
- Angular CLI 21.x

```bash
npm install -g @angular/cli@21
```

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd olimpic-app

# Instalar dependencias
npm install
```

## Configuración de entorno

El archivo de entorno de desarrollo está en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
};
```

Para producción, el build usa `src/environments/environment.prod.ts`. La URL de la API se inyecta vía CI/CD.

> **Nunca** agregar secretos ni tokens en estos archivos. Usar variables de entorno del sistema o Secret Manager.

## Ejecución en desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

> El backend (microservicios Node.js) debe estar corriendo en `http://localhost:3000` para que las llamadas API funcionen.

## Build de producción

```bash
npm run build
# Artefacto generado en: dist/olimpic-app/
```

## Tests

```bash
ng test
```

Los tests usan **Vitest** con **jsdom**. Seguir el patrón Given / When / Then en todos los casos:

```typescript
it('debe retornar 404 cuando el torneo no existe', async () => {
  // Given
  // When
  // Then
});
```

## Colecciones Postman

Las colecciones de Postman para pruebas de la API están en:

```
postmanCollections/
└── OlimpicApp.postman_collection.json   # (pendiente — se agrega junto con el backend)
```

## Autores

| Nombre            | Rol                    |
|-------------------|------------------------|
| Wilson Velandia   | Desarrollador principal |

## Licencia

Uso interno — Seguros Bolívar.
