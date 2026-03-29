---
name: OKR Methodology
description: Framework para diseñar, validar y mejorar Objetivos y Resultados Clave (OKRs) en Inner Event, basado en "Measure What Matters" de John Doerr y frameworks complementarios.
---

# OKR Methodology Skill

## Cuándo usar este Skill

Usa estas instrucciones cuando:
- El usuario cree, edite o evalúe **Objetivos** u **OKRs** en el módulo `/strategy`
- Se generen **sugerencias de IA** para objetivos, megas o KRs
- Se valide la calidad de un KR (medibilidad, ambición, alcance)
- Se diseñen **ponderaciones** de objetivos o KRs
- Se evalúe el **progreso global** de la estrategia

## Fuentes de referencia

| Libro / Framework | Autor | Uso principal |
|---|---|---|
| *Measure What Matters* | John Doerr | Framework OKR central |
| *Radical Focus* | Christina Wodtke | OKRs para startups y equipos |
| *High Output Management* | Andy Grove | Origen histórico de OKRs |
| *The Lean Startup* | Eric Ries | Métricas accionables vs. vanidosas |
| *Balanced Scorecard (BSC)* | Kaplan & Norton | Perspectivas estratégicas |

## Reglas fundamentales de OKRs

### 1. Anatomía de un Objetivo (O)
- **Cualitativo**: Describe un resultado deseado, no un número
- **Inspiracional**: Debe motivar al equipo
- **Accionable**: El equipo puede influir directamente en él
- **Limitado en tiempo**: Tiene un horizonte claro (trimestral o anual)
- **Ejemplo bueno**: "Convertirnos en referentes de experiencia del cliente en el sector"
- **Ejemplo malo**: "Subir el NPS a 80" ← Esto es un KR, no un Objetivo

### 2. Anatomía de un Resultado Clave (KR)
- **Cuantitativo**: Siempre incluye un número medible
- **Específico**: Describe exactamente qué se mide
- **Verificable**: Cualquier persona puede validar si se cumplió
- **Ambicioso pero alcanzable**: El "stretch goal" ideal es ~70% de cumplimiento
- **Sin ambigüedad**: No usa palabras como "mejorar", "optimizar" sin métricas
- **Ejemplo bueno**: "Aumentar la tasa de retención de clientes del 72% al 85%"
- **Ejemplo malo**: "Mejorar la retención de clientes" ← No es medible

### 3. Reglas de cantidad
- **3-5 Objetivos** por ciclo (trimestral o anual)
- **2-5 KRs** por Objetivo (ideal: 3)
- Si tienes >5 KRs en un Objetivo, probablemente son 2 Objetivos separados

### 4. Tipos de KRs
| Tipo | Descripción | Ejemplo |
|---|---|---|
| **Métrico** | Un número que crece/decrece | "Reducir churn rate de 8% a 3%" |
| **Hito** | Un entregable binario (sí/no) | "Lanzar la v2.0 del producto" |
| **Porcentual** | Una fracción con numerador/denominador | "80% de tickets resueltos en <24h" |

### 5. Escala de puntuación (Doerr)
| Score | Significado | Color sugerido |
|---|---|---|
| 0.0 - 0.3 | Rojo: No se progresó significativamente | `hsl(var(--destructive))` |
| 0.4 - 0.6 | Amarillo: Progreso parcial, necesita atención | `hsl(var(--warning))` |
| 0.7 - 1.0 | Verde: Cumplido o superado | `hsl(var(--success))` |

> **Nota Doerr**: Un score de **0.7** es considerado "éxito" en la cultura OKR. Si todos los KRs están en 1.0, los objetivos no eran lo suficientemente ambiciosos.

### 6. Cadencia recomendada
| Nivel | Frecuencia | Ejemplo en Inner Event |
|---|---|---|
| **Propósito (Estrella Polar)** | Permanente / Revisión anual | Propósito del tenant |
| **Megas (Gran Destino)** | Anual / Multi-anual | Megas con deadline |
| **Objetivos** | Trimestral | Objetivos bajo cada Mega |
| **KRs** | Trimestral con check-ins semanales | KRs con `updatePeriodicity` |

## Jerarquía en Inner Event → OKR Mapping

```
Propósito (Estrella Polar)     → Misión / North Star
  └── Mega (Gran Destino)      → Objetivo Anual / BHAG
       └── Objetivo            → Objective (O)
            └── Key Result     → Key Result (KR)
                 └── Iniciativa → Tarea / Proyecto
```

## Ponderaciones (Weights)

Cuando el usuario configure ponderaciones en el módulo `/strategy?tab=WEIGHTS`:

1. **Por defecto**, todos los KRs tienen peso igual (weight = 1)
2. La suma de pesos **no necesita** ser 100; se calcula proporcionalmente
3. Un KR con peso 0 significa que está **desactivado** temporalmente
4. Los pesos deben reflejar **importancia estratégica**, no esfuerzo
5. Se recomienda notificar al usuario cuando un KR nuevo tiene peso 0

## Validaciones para IA

Cuando generes sugerencias de IA para OKRs, verifica:

- [ ] ¿El Objetivo es cualitativo e inspiracional?
- [ ] ¿Cada KR tiene un número concreto?
- [ ] ¿Hay entre 2-5 KRs por Objetivo?
- [ ] ¿Los KRs son independientes entre sí (no duplicados)?
- [ ] ¿El KR tiene una unidad de medida clara (%, unidades, $)?
- [ ] ¿Es alcanzable en el horizonte temporal definido?

## Anti-patrones a evitar

| Anti-patrón | Problema | Corrección |
|---|---|---|
| KR como tarea | "Implementar CRM" no es medible | "Migrar 100% de contactos al nuevo CRM" |
| Objetivo como métrica | "Alcanzar $1M en ventas" | Mover a KR bajo un Objetivo cualitativo |
| Demasiados KRs | >5 KRs diluyen el enfoque | Agrupar o priorizar |
| KR binario sin impacto | "Hacer reunión semanal" | "Lograr 90% de asistencia a reuniones semanales" |
| Score siempre 1.0 | Objetivos poco ambiciosos | Aumentar la ambición del stretch goal |
