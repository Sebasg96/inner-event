---
name: Rituals Framework
description: Framework para diseñar, facilitar y evaluar rituales de equipo en Inner Event, basado en metodologías ágiles (Scrum, EOS, Lean) y mejores prácticas de facilitación.
---

# Rituals Framework Skill

## Cuándo usar este Skill

Usa estas instrucciones cuando:
- El usuario cree, edite o evalúe **Rituales** en el módulo `/rituals`
- Se generen **sugerencias de IA** para agendas, compromisos o frecuencia de rituales
- Se diseñen **plantillas** de rituales recurrentes
- Se evalúe la **efectividad** de los rituales realizados
- Se sugiera la **cadencia** ideal de rituales para un equipo

## Fuentes de referencia

| Libro / Framework | Autor | Uso principal |
|---|---|---|
| *Scrum Guide* | Schwaber & Sutherland | Eventos Scrum (Sprint Review, Retro, Planning) |
| *Traction (EOS)* | Gino Wickman | L10 Meeting, Quarterly Pulse, Annual Planning |
| *The Five Dysfunctions of a Team* | Patrick Lencioni | Confianza, conflicto constructivo, compromiso |
| *Agile Retrospectives* | Derby & Larsen | Formatos de retrospectiva |
| *Death by Meeting* | Patrick Lencioni | Tipos de reuniones y su propósito |
| *Measure What Matters* | John Doerr | Cadencia de revisión OKR |

---

## Taxonomía de Rituales

### Por frecuencia

| Tipo | Frecuencia | Duración | Propósito principal |
|---|---|---|---|
| **Daily Standup** | Diario | 15 min | Sincronización, bloqueos |
| **Weekly Check-in** | Semanal | 60 min | Revisión de métricas, prioridades |
| **Sprint Review** | Quincenal | 90 min | Demostrar avances, feedback |
| **Retrospectiva** | Quincenal/Mensual | 60-90 min | Mejora continua del equipo |
| **Monthly Review** | Mensual | 2 horas | Revisión de OKRs, ajustes estratégicos |
| **Quarterly Planning** | Trimestral | Medio día | Definir OKRs del trimestre |
| **Annual Planning** | Anual | 1-2 días | Visión, Megas, Propósito |

### Por propósito

| Categoría | Ejemplos | Enfoque |
|---|---|---|
| **Planificación** | Sprint Planning, Quarterly Planning | Decidir QUÉ hacer |
| **Sincronización** | Daily, Weekly Check-in | Alinear al equipo |
| **Revisión** | Sprint Review, Monthly Review | Evaluar progreso vs. OKRs |
| **Reflexión** | Retrospectiva, Post-mortem | Aprender y mejorar |
| **Celebración** | All-hands, Demo Day | Reconocer logros, cultura |

---

## Anatomía de un Ritual Efectivo

### Estructura recomendada (formato L10 de EOS adaptado)

```
1. Check-in (5 min)
   - ¿Cómo llega cada uno? (escala 1-10 o emoji)
   - Buenas noticias personales/profesionales

2. Scorecard Review (10 min)
   - Revisión de métricas clave (KRs)
   - ¿Estamos on-track, off-track o at-risk?

3. To-Do Review (5 min)
   - Revisión de compromisos del ritual anterior
   - ¿Completado? ¿Bloqueado? ¿Reprogramado?

4. Headlines / IDS (20-30 min)
   - Identificar problemas/oportunidades
   - Discutir soluciones
   - Resolver o escalar

5. Compromisos y cierre (5 min)
   - Cada participante dice su compromiso concreto
   - Fecha límite del compromiso
   - Rating del ritual (1-10)
```

### Reglas de oro

1. **Empieza y termina a tiempo**: El respeto por el tiempo genera confianza
2. **Agenda visible**: Todos deben saber la estructura antes de entrar
3. **Facilitador rotativo**: Dales ownership a diferentes miembros
4. **Compromisos concretos**: Todo ritual debe terminar con accionables claros
5. **Sin dispositivos**: Presencia plena durante el ritual
6. **Documentación inmediata**: Los compromisos se registran durante el ritual, no después

---

## Compromisos

### Reglas de un buen compromiso

Un compromiso es la unidad mínima de acción que sale de un ritual.

| Criterio | Descripción | Ejemplo bueno | Ejemplo malo |
|---|---|---|---|
| **Específico** | Describe exactamente qué se va a hacer | "Enviar propuesta al cliente X" | "Avanzar con el cliente" |
| **Con dueño** | Tiene un responsable único | "Juan se encarga" | "El equipo lo hace" |
| **Con fecha** | Tiene deadline claro | "Para el viernes 28" | "Lo antes posible" |
| **Verificable** | Se puede confirmar como hecho/no-hecho | "Publicar en producción" | "Trabajar en el deploy" |

### Estados de compromisos

| Estado | Significado | Acción |
|---|---|---|
| `PENDING` | Aún no se ha completado | Seguimiento en próximo ritual |
| `COMPLETED` | Se verificó como terminado | Celebrar y cerrar |
| `OVERDUE` | Pasó la fecha sin completarse | Escalar o renegociar deadline |

---

## Métricas de salud de rituales

Para evaluar si un ritual es efectivo, mide:

### 1. Tasa de cumplimiento de compromisos
```
% Cumplimiento = (Compromisos completados / Compromisos totales) × 100
```
- **≥ 80%**: Excelente, el equipo es confiable
- **60-79%**: Aceptable, revisar bloqueos
- **< 60%**: Alerta, los compromisos no son realistas o hay problemas de accountability

### 2. Asistencia
- **≥ 90%**: Ritual valorado por el equipo
- **< 70%**: Cuestionar si el ritual es necesario o si el formato debe cambiar

### 3. Duración real vs. planeada
- Si consistentemente excede el tiempo, la agenda necesita ajuste
- Si termina muy antes, puede ser demasiado superficial

### 4. NPS del ritual
Pregunta al final: *"¿Qué tan útil fue este ritual? (1-10)"*
- **≥ 8**: Excelente
- **5-7**: Necesita ajuste de formato o frecuencia
- **< 5**: Considerar eliminar o rediseñar completamente

---

## Cadencia recomendada (OKR + Rituales)

```
                    ┌──────────────────────────────────────┐
  ANUAL             │  Annual Planning (Propósito + Megas)  │
                    └──────────────────────────────────────┘
                         ↓           ↓           ↓           ↓
  TRIMESTRAL        ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
                    │ Q1 Plan │ │ Q2 Plan │ │ Q3 Plan │ │ Q4 Plan │
                    │ (OKRs)  │ │ (OKRs)  │ │ (OKRs)  │ │ (OKRs)  │
                    └─────────┘ └─────────┘ └─────────┘ └─────────┘
                      ↓ ↓ ↓ ↓
  MENSUAL           Monthly Review (Scorecard + Ajustes)
                      ↓ ↓ ↓ ↓
  SEMANAL           Weekly Check-in (Métricas + IDS)
                      ↓↓↓↓↓
  DIARIO            Daily Standup (Sincronización rápida)
```

---

## Integración con Inner Event

### Mapeo de conceptos a la app

| Concepto | Modelo en Prisma | Dónde se usa |
|---|---|---|
| Ritual | `Ritual` | `/rituals` (lista y detalle) |
| Participante | `RitualParticipant` | Panel derecho del detalle |
| Compromiso | `RitualCommitment` | Panel principal del detalle |
| Estado del ritual | `Ritual.status` | PROGRAMADO → EN CURSO → COMPLETADO |
| Registro de cambios | `RitualActionLog` | Auditoría interna |

### Sugerencias de IA para rituales

Cuando el módulo de IA genere sugerencias, debe considerar:

1. **Tipo de ritual**: ¿Es planificación, revisión o retrospectiva?
2. **Frecuencia**: ¿Es coherente con la cadencia del equipo?
3. **Duración**: ¿Es realista para la cantidad de participantes?
4. **Compromisos**: ¿Los compromisos anteriores se cumplieron?
5. **Temas pendientes**: ¿Hay compromisos vencidos que abordar?

### Notificaciones recomendadas

| Trigger | Notificación | Anticipación |
|---|---|---|
| Ritual próximo | "Tienes un ritual programado" | 48 horas antes |
| Compromiso vencido | "Compromiso pendiente de [ritual]" | Inmediata |
| Baja asistencia | "Solo X de Y participantes confirmados" | 24 horas antes |
| Racha de cumplimiento | "¡El equipo lleva 4 rituales con >80% de cumplimiento!" | Post-ritual |

---

## Anti-patrones de rituales

| Anti-patrón | Problema | Solución |
|---|---|---|
| **Ritual sin agenda** | Se pierde tiempo, no hay estructura | Usar plantilla predefinida |
| **Ritual sin compromisos** | No hay accountability | Obligar al menos 1 compromiso por sesión |
| **Ritual status-report** | Solo se reporta, no se discute | Formato IDS (Identify, Discuss, Solve) |
| **Asistentes pasivos** | Solo hablan 2-3 personas | Ronda de check-in obligatoria para todos |
| **Ritual fantasma** | Se programa pero no se hace | Alertas automáticas + retrospectiva sobre la cadencia |
| **Ritual interminable** | Excede el timeboxing consistentemente | Reducir la agenda o dividir en 2 rituales |

---

## Formatos de Retrospectiva

Estos formatos pueden sugerirse cuando el tipo de ritual es "Retrospectiva":

### 1. Start / Stop / Continue
- ¿Qué debemos **empezar** a hacer?
- ¿Qué debemos **dejar** de hacer?
- ¿Qué debemos **seguir** haciendo?

### 2. Estrella de Mar
- **Más de**: Cosas que hacemos bien y queremos ampliar
- **Menos de**: Cosas que reducir
- **Empezar**: Nuevas prácticas
- **Parar**: Prácticas que eliminar
- **Seguir**: Lo que funciona tal cual

### 3. 4Ls (Liked, Learned, Lacked, Longed for)
- **Liked**: Lo que nos gustó
- **Learned**: Lo que aprendimos
- **Lacked**: Lo que nos faltó
- **Longed for**: Lo que deseábamos tener

### 4. Mad / Sad / Glad
Formato emocional, útil para equipos que necesitan expresar sentimientos:
- 😡 **Mad**: Frustraciones
- 😢 **Sad**: Decepciones
- 😊 **Glad**: Alegrías y logros
