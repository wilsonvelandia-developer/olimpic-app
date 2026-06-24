# Tasks: Modo Árbitro en Vivo

## Fase 1 — Marcador + Timer + Panel Base (MVP sin WebSocket)

- [ ] 1. Crear migración DB: tabla `match_events` para registrar eventos del partido
- [ ] 2. Crear migración DB: tabla `match_sanctions` y `sanction_types`
- [ ] 3. Crear migración DB: tabla `match_scorers` para goleadores/anotadores
- [ ] 4. Crear seed de `sanction_types` (tarjeta amarilla, roja, falta técnica por deporte)
- [ ] 5. Backend: Crear endpoint `POST /matches/:id/events` para registrar eventos (score, sanction, sub)
- [ ] 6. Backend: Crear endpoint `GET /matches/:id/events` para obtener timeline de eventos
- [ ] 7. Backend: Crear endpoint `POST /matches/:id/sanctions` para registrar sanciones
- [ ] 8. Backend: Crear endpoint `POST /matches/:id/scorers` para registrar anotadores
- [ ] 9. Backend: Crear endpoint `GET /matches/:id/scorers` para obtener tabla de anotadores
- [ ] 10. Frontend: Crear feature module `referee/` con routing y guard (role: referee/admin)
- [ ] 11. Frontend: Crear `referee-panel` container component (layout principal mobile-first)
- [ ] 12. Frontend: Crear `scoreboard` component con botones +/- táctiles
- [ ] 13. Frontend: Crear `timer` component con play/pause/reset y auto-pause en eventos
- [ ] 14. Frontend: Crear `referee.service.ts` con estado local del partido (signals)
- [ ] 15. Frontend: Crear `match-events-log` timeline de eventos
- [ ] 16. Frontend: Crear `scorer-select` dialog para seleccionar jugador que anota
- [ ] 17. Frontend: Integrar panel con REST API existente (score update, start/finish)
- [ ] 18. Verificar build y tests de Fase 1

## Fase 2 — WebSocket (Tiempo Real)

- [ ] 19. Backend: Instalar Socket.IO en el gateway service
- [ ] 20. Backend: Configurar WebSocket server con JWT auth en handshake
- [ ] 21. Backend: Implementar room management (match:{matchId}) y referee lock
- [ ] 22. Backend: Event handlers para referee:score, referee:substitution, referee:sanction
- [ ] 23. Backend: Broadcast events a espectadores del room
- [ ] 24. Frontend: Instalar socket.io-client y crear `referee-socket.service.ts`
- [ ] 25. Frontend: Conectar referee-panel al WebSocket (emit eventos en vez de REST)
- [ ] 26. Frontend: Crear vista `live-match` para espectadores (recibe broadcast)
- [ ] 27. Frontend: Crear widget `live-feed` en dashboard con partidos en curso
- [ ] 28. Verificar comunicación bidireccional y multi-partido

## Fase 3 — Sanciones + Rotación + Anotadores

- [ ] 29. Frontend: Crear `sanction-dialog` con selección de tipo + jugador + minuto
- [ ] 30. Frontend: Crear `rotation-panel` con visualización gráfica de posiciones (volleyball)
- [ ] 31. Frontend: Integrar rotación con referee:rotation event
- [ ] 32. Backend: Validar acumulación de sanciones y expulsión automática
- [ ] 33. Backend: Endpoint para consultar sanciones por jugador/equipo
- [ ] 34. Frontend: Crear `substitution-dialog` mejorado con validación visual de límites
- [ ] 35. Verificar flujo completo de partido con sanciones y rotación

## Fase 4 — Offline Resilience + Standings Automáticos

- [ ] 36. Frontend: Implementar cola de eventos local (IndexedDB) para offline
- [ ] 37. Frontend: Reconexión automática de WebSocket con re-sync de estado
- [ ] 38. Backend: Al emitir `referee:match_end`, recalcular standings automáticamente
- [ ] 39. Backend: Broadcast de `standings:updated` a clientes en el room del torneo
- [ ] 40. Frontend: Actualizar standings-table en tiempo real al recibir broadcast
- [ ] 41. Tests: Agregar tests para WebSocket handlers y referee.service
- [ ] 42. Tests: Agregar tests para offline queue y re-sync
