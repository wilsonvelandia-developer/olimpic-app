# Requirements — OlimpicApp Frontend

## Overview

Web application for managing and administering sports tournaments. The system must be scalable to support multiple sports (volleyball, football, basketball, tennis, and others).

## Functional Requirements

### RF-01 — Multi-sport Support
- The system must support configuring tournaments for different sports
- Each sport must have configurable rules (number of players, sets, periods, etc.)
- The architecture must allow adding new sports without modifying core modules

### RF-02 — Tournament Management
- Create, edit, and delete tournaments
- Configure tournament format: groups + knockout, all-vs-all, single elimination, double elimination
- Assign sport, category, and season to each tournament
- View tournament status: upcoming, in progress, completed

### RF-03 — Team Management
- Register and manage teams per tournament
- Assign players to teams
- Manage rosters and player positions

### RF-04 — Schedule and Fixtures
- Auto-generate match fixtures based on tournament format
- Manually adjust scheduled matches
- Record match results
- View standings and statistics

### RF-05 — Statistics and Reports
- Team and player statistics per tournament
- Standings table with points, wins, losses, draws
- Match history

### RF-06 — User Interface
- Responsive design (desktop and tablet)
- Navigation by tournament, sport, and category
- Real-time updates via API polling or WebSockets

## Non-Functional Requirements

### RNF-01 — Technology
- Framework: Angular 21.x (standalone components, OnPush)
- Language: TypeScript 5.x with strict mode
- Styles: CSS3 (no preprocessor)
- HTTP: HttpClient (Angular built-in)
- Testing: Vitest + jsdom
- Build: Angular CLI / esbuild

### RNF-02 — Architecture
- Standalone components (no NgModules)
- Lazy loading per feature module
- Reactive state with RxJS signals
- Consumption of Node.js microservices via REST API
- No business logic in components (delegated to services)

### RNF-03 — Security
- JWT tokens in httpOnly cookies (managed by the backend)
- No tokens in localStorage
- Input validation on all forms (Angular Reactive Forms + Zod)
- HTTP interceptors for auth headers and error handling

### RNF-04 — Performance
- Route-level lazy loading
- OnPush change detection strategy
- Target: initial load < 3s on standard connection

## Acceptance Criteria

- [ ] The app builds without errors (`ng build`)
- [ ] All tests pass (`ng test`)
- [ ] Navigation between modules works without errors
- [ ] The app correctly consumes the REST API with auth headers
- [ ] The design is responsive on resolutions >= 768px
