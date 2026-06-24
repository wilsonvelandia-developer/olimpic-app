# Feature: Modo Árbitro en Vivo (Live Referee Mode)

## Descripción General

Panel de control en tiempo real optimizado para tablet/móvil donde el árbitro gestiona el desarrollo completo de un partido: marcador, cronómetro, sanciones, sustituciones, anotadores, rotación (voleibol), con notificaciones en tiempo real a espectadores y actualización automática de standings y estadísticas del torneo. Soporta múltiples partidos simultáneos.

---

## Requisitos Funcionales

### RF-01: Panel de Marcador en Vivo
- Botones grandes (touch-friendly, mínimo 48x48px) para sumar/restar puntos a cada equipo.
- Visualización prominente del marcador actual (home vs away) con nombres/escudos.
- Para deportes con sets/períodos: mostrar el marcador del período actual y el resumen de sets ganados.
- Indicador visual del equipo que lleva ventaja.
- Registro del jugador que anota cada punto (opcional, activable por deporte).

### RF-02: Cronómetro de Tiempo de Juego
- Cronómetro configurable según el deporte (cuenta regresiva para fútbol/basketball, sin límite para volleyball).
- Botones de Play/Pause/Reset prominentes.
- Pausa automática al registrar: sustitución, sanción, timeout, fin de set.
- Visualización del tiempo transcurrido siempre visible en la parte superior.
- Alerta vibratoria y visual al finalizar un período/tiempo.

### RF-03: Gestión de Sustituciones
- Selección rápida del jugador que sale y el que entra (lista con dorsal y nombre).
- Validación en tiempo real del límite de cambios según reglas del deporte.
- Registro del minuto/tiempo en que se realiza la sustitución.
- Pausa automática del cronómetro al abrir el panel de sustitución.
- Historial de sustituciones realizadas visible en el partido.

### RF-04: Sanciones (Tarjetas/Faltas)
- Registro de tarjetas amarillas, rojas, faltas técnicas según deporte.
- Selección del jugador sancionado.
- Expulsión automática por acumulación (configurable: 2 amarillas = roja).
- Registro del minuto de la sanción.
- Notificación cuando un jugador está al borde de la expulsión.

### RF-05: Rotación de Voleibol
- Visualización gráfica de las 6 posiciones en cancha.
- Botón de rotación que mueve automáticamente los jugadores (sentido horario).
- Indicador visual del servidor actual (posición 1).
- Validación de que la rotación se aplica en el momento correcto.
- Historial de rotaciones por set.

### RF-06: Captura de Anotadores
- Al sumar un punto, opción de seleccionar el jugador que anotó.
- Tabla de goleadores/anotadores que se actualiza en tiempo real.
- Soporte por deporte: goles (fútbol), puntos (basketball), aces/kills (volleyball).

### RF-07: Notificaciones en Tiempo Real
- WebSocket (Socket.IO) para broadcast de eventos del partido.
- Eventos emitidos: gol/punto, inicio/fin de período, sustitución, sanción, fin de partido.
- Los espectadores suscritos a un partido reciben actualizaciones instantáneas.
- Soporte para múltiples partidos simultáneos (cada partido = un canal/room).

### RF-08: Actualización Automática de Standings
- Al finalizar un partido, recalcular automáticamente la tabla de posiciones de la fase.
- Actualizar estadísticas del torneo (total goles, partidos jugados, etc).
- Propagación en tiempo real a todos los clientes que ven el standing.

### RF-09: Múltiples Partidos Simultáneos
- Cada árbitro controla un solo partido a la vez.
- Múltiples árbitros pueden controlar partidos diferentes simultáneamente.
- El backend maneja múltiples conexiones WebSocket concurrentes sin conflicto.
- Vista de "partidos en vivo" para espectadores que muestra todos los partidos activos.

### RF-10: Acceso y Permisos
- Solo usuarios con rol `admin` o `referee` pueden acceder al modo árbitro.
- Un árbitro debe "iniciar" el partido antes de poder usar el panel.
- Bloqueo de partido: solo un árbitro puede controlar un partido al mismo tiempo.

---

## Requisitos No Funcionales

### RNF-01: Rendimiento
- Latencia de WebSocket < 500ms para notificaciones.
- El panel debe funcionar fluido en dispositivos móviles con baja conectividad (offline-first para el estado local, sincronización al recuperar red).

### RNF-02: Responsividad
- Diseño mobile-first optimizado para tablets (768px–1024px).
- Touch targets de mínimo 44x44px según WCAG.
- Landscape y portrait modes soportados.

### RNF-03: Resiliencia
- Si se pierde la conexión WebSocket, el estado del partido se mantiene localmente.
- Reconexión automática con re-sincronización del estado.
- Heartbeat para detectar desconexiones.

### RNF-04: Seguridad
- Solo árbitros autenticados pueden emitir eventos de partido.
- Validación server-side de todos los eventos antes de broadcast.
- Rate limiting en eventos WebSocket.

---

## Criterios de Aceptación

1. Un árbitro puede iniciar un partido, sumar puntos, y los espectadores ven el marcador actualizado en < 1 segundo.
2. El cronómetro se pausa automáticamente al registrar una sustitución y se reanuda manualmente.
3. Las rotaciones de voleibol se aplican correctamente y se reflejan en el panel.
4. Al finalizar un partido, la tabla de posiciones se actualiza sin intervención manual.
5. Dos árbitros pueden controlar dos partidos diferentes simultáneamente sin interferencia.
6. El panel es usable en una tablet de 10" en orientación landscape con botones accesibles con el pulgar.
7. Las sanciones se registran con jugador + minuto y se notifican en tiempo real.
