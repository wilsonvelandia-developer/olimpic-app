# Design: Modo Árbitro en Vivo

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Angular)                           │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Referee Panel   │  │  Live Match View │  │  Live Feed   │  │
│  │  (solo referee)  │  │  (espectadores)  │  │  (widget)    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                      │                    │          │
│           ▼                      ▼                    ▼          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              WebSocket Service (Socket.IO Client)            ││
│  └───────────────────────────────┬─────────────────────────────┘│
└──────────────────────────────────┼──────────────────────────────┘
                                   │ WSS
┌──────────────────────────────────┼──────────────────────────────┐
│                     BACKEND                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │            Gateway (Express + Socket.IO Server)             ││
│  │  - JWT auth on connection                                   ││
│  │  - Room management: match:{matchId}                         ││
│  │  - Event validation + broadcast                             ││
│  └──────────┬──────────────────────────────────────────────────┘│
│             │                                                    │
│  ┌──────────▼──────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │    Matches Service   │  │  Standings  │  │    Teams       │  │
│  │  (score, subs, etc)  │  │  (recalc)   │  │  (players)    │  │
│  └──────────────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Modelo de Datos — Nuevas Entidades

### Tabla: `match_events`
Registro de todos los eventos del partido para auditoría y replay.

```sql
CREATE TABLE match_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_type  VARCHAR(30) NOT NULL, -- 'goal', 'point', 'substitution', 'sanction', 'rotation', 'period_start', 'period_end', 'timeout'
  team_id     UUID REFERENCES teams(id),
  player_id   UUID REFERENCES players(id),
  period_number INT NOT NULL,
  match_minute  INT, -- minuto del partido (nullable para deportes sin timer)
  payload     JSONB DEFAULT '{}', -- datos extra según el tipo de evento
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_type  ON match_events(match_id, event_type);
```

### Tabla: `match_sanctions`
```sql
CREATE TABLE match_sanctions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id          UUID NOT NULL REFERENCES teams(id),
  player_id        UUID NOT NULL REFERENCES players(id),
  sanction_type_id UUID NOT NULL REFERENCES sanction_types(id),
  period_number    INT NOT NULL,
  match_minute     INT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabla: `sanction_types` (catálogo)
```sql
CREATE TABLE sanction_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id      UUID NOT NULL REFERENCES sports(id),
  name          VARCHAR(50) NOT NULL, -- 'Tarjeta Amarilla', 'Tarjeta Roja', 'Falta Técnica'
  slug          VARCHAR(30) NOT NULL,
  severity      INT NOT NULL DEFAULT 1, -- 1=warning, 2=ejection
  accumulation_limit INT, -- null = no acumulación, 2 = 2 amarillas = roja
  points_effect INT NOT NULL DEFAULT 0, -- efecto en fair play score
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabla: `match_scorers` (goleadores/anotadores)
```sql
CREATE TABLE match_scorers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id       UUID NOT NULL REFERENCES teams(id),
  player_id     UUID NOT NULL REFERENCES players(id),
  period_number INT NOT NULL,
  match_minute  INT,
  points        INT NOT NULL DEFAULT 1, -- 1 para gol/punto, 2/3 para basketball
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## API WebSocket — Eventos

### Eventos del Árbitro → Servidor (emit)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `referee:join` | `{ matchId }` | Árbitro toma control del partido |
| `referee:score` | `{ matchId, teamId, playerId?, points, periodNumber }` | Suma punto/gol |
| `referee:undo_score` | `{ matchId, teamId, periodNumber }` | Resta último punto |
| `referee:substitution` | `{ matchId, teamId, playerOutId, playerInId, periodNumber, minute }` | Registra cambio |
| `referee:sanction` | `{ matchId, teamId, playerId, sanctionTypeId, periodNumber, minute }` | Registra sanción |
| `referee:rotation` | `{ matchId, teamId, setNumber }` | Aplica rotación voleibol |
| `referee:period_start` | `{ matchId, periodNumber }` | Inicia período |
| `referee:period_end` | `{ matchId, periodNumber, homeScore, awayScore }` | Finaliza período |
| `referee:match_end` | `{ matchId }` | Finaliza partido |
| `referee:timer_pause` | `{ matchId, elapsed }` | Pausa cronómetro |
| `referee:timer_resume` | `{ matchId }` | Reanuda cronómetro |

### Eventos del Servidor → Espectadores (broadcast)

| Evento | Payload | Canal |
|--------|---------|-------|
| `match:score_update` | `{ matchId, homeScore, awayScore, scorer?, period }` | `match:{matchId}` |
| `match:substitution` | `{ matchId, teamId, playerOut, playerIn, minute }` | `match:{matchId}` |
| `match:sanction` | `{ matchId, teamId, player, type, minute }` | `match:{matchId}` |
| `match:period_change` | `{ matchId, period, status }` | `match:{matchId}` |
| `match:finished` | `{ matchId, finalScore, winner }` | `match:{matchId}` |
| `match:timer_sync` | `{ matchId, elapsed, running }` | `match:{matchId}` |

## Componentes Frontend

### Estructura del Feature Module

```
src/app/features/referee/
├── referee.routes.ts
├── referee.service.ts           # Lógica de estado del partido
├── referee-socket.service.ts    # WebSocket connection management
├── referee-panel/
│   ├── referee-panel.ts         # Container principal
│   ├── referee-panel.html
│   └── referee-panel.css
├── scoreboard/
│   ├── scoreboard.ts            # Marcador con botones +/-
│   └── scoreboard.css
├── timer/
│   ├── timer.ts                 # Cronómetro play/pause/reset
│   └── timer.css
├── substitution-dialog/
│   ├── substitution-dialog.ts   # Modal de sustitución
│   └── substitution-dialog.css
├── sanction-dialog/
│   ├── sanction-dialog.ts       # Modal de sanción
│   └── sanction-dialog.css
├── rotation-panel/
│   ├── rotation-panel.ts        # Panel visual de rotación (volleyball)
│   └── rotation-panel.css
├── match-events-log/
│   ├── match-events-log.ts      # Timeline de eventos del partido
│   └── match-events-log.css
└── scorer-select/
    ├── scorer-select.ts          # Selector rápido de jugador anotador
    └── scorer-select.css
```

### UX del Panel Principal (Layout)

```
┌─────────────────────────────────────────────────────────────┐
│  ⏱ 23:45  │  SET 2  │  [⏸ Pause]  [⏹ End Period]          │  ← Timer bar
├────────────────────────┬────────────────────────────────────┤
│                        │                                     │
│    🟡 TEAM A           │           TEAM B 🔵                 │
│                        │                                     │
│      ┌──────┐          │          ┌──────┐                   │
│      │  15  │          │          │  12  │                   │  ← Period score
│      └──────┘          │          └──────┘                   │
│                        │                                     │
│   Sets: 1              │              Sets: 0                │
│                        │                                     │
│  ┌─────┐  ┌─────┐     │     ┌─────┐  ┌─────┐              │
│  │ +1  │  │ -1  │     │     │ +1  │  │ -1  │              │  ← Score buttons
│  └─────┘  └─────┘     │     └─────┘  └─────┘              │
│                        │                                     │
├────────────────────────┴────────────────────────────────────┤
│  [🔄 Rotación]  [🔀 Sustitución]  [🟨 Sanción]  [📋 Log]   │  ← Action bar
└─────────────────────────────────────────────────────────────┘
```

## Stack Técnico

| Concern | Tecnología |
|---------|-----------|
| WebSocket Server | Socket.IO 4.x (sobre el gateway Express existente) |
| WebSocket Client | socket.io-client 4.x (Angular service) |
| Estado local | Angular Signals + local state machine |
| Timer | `requestAnimationFrame` + Web Workers (background timer) |
| Persistencia local | IndexedDB (para offline resilience) |
| Auth en WebSocket | JWT token en handshake (cookie-based como HTTP) |

## Flujo Principal: Árbitro inicia partido

1. Árbitro navega a `/referee/match/:id`
2. Frontend verifica que el partido está en estado `scheduled` o `in_progress`
3. Si `scheduled` → llama `PUT /matches/:id/start` (crea períodos)
4. Conecta WebSocket y emite `referee:join { matchId }`
5. Server valida JWT + rol referee/admin + partido no bloqueado
6. Server marca el partido como "locked" por este referee
7. Server une al referee al room `match:{matchId}`
8. Frontend recibe estado actual y renderiza el panel

## Consideraciones de Implementación

### Fases de desarrollo sugeridas:
1. **Fase 1**: Marcador + Timer (sin WebSocket, solo REST) — validar UX
2. **Fase 2**: WebSocket integration — eventos en tiempo real
3. **Fase 3**: Sanciones + Anotadores — enriquecer datos
4. **Fase 4**: Offline resilience + multi-partido simultáneo

### Dependencias nuevas:
- Backend: `socket.io@4.8.1`
- Frontend: `socket.io-client@4.8.1`
