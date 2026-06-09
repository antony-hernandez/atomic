# Changelog

All notable changes to Atomic are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## Versioning conventions

### Package (`package.json`)
- **MAJOR** — breaking change to installer behavior or skill contract (e.g. renamed files, removed steps)
- **MINOR** — new skill added, new installer feature, new tech section
- **PATCH** — rule wording fix, bug in installer, typo

### Skills (`version` in frontmatter)
- **MAJOR** — workflow restructured or step removed (users need to re-learn the flow)
- **MINOR** — new rule, new section, new step added
- **PATCH** — wording clarification, typo, example improved

---

## [0.18.0] - 2026-06-09

### Added
- Plugin model: `.claude-plugin/plugin.json` siguiendo el patrón skills.sh de Matt Pocock
  - Registra los skills `/task` y `/spec` para compatibilidad con el ecosistema skills.sh
- SessionStart hook: `check-atomic-updates.py` instalado en `.claude/hooks/`
  - Al iniciar sesión compara versiones locales contra GitHub (timeout 3s, no bloqueante)
  - Si hay update disponible → `⚡ Atomic — update disponible: /task X → Y` en el systemMessage
- Installer: copia automática del hook de update check a `.claude/hooks/check-atomic-updates.py`
  - Registra el hook en `settings.json` bajo `hooks.SessionStart`
  - Idempotente — no duplica el hook si ya está configurado
- Templates: hook script en `packages/cli/templates/hooks/` para soporte de instalación remota (curl | node)

## [0.17.0] - 2026-06-09

### Added
- Skill `/task` v2.1.0: verificación de contratos FE↔BE desde la spec
  - Paso 3: spec técnica se lee completa (FE_CHANGES + BE_CHANGES) — el filtro por TASK_TYPE solo aplica para qué implementar, no para qué leer
  - Paso 5: cross-check de contratos — compara valores que cruzan la frontera (enum values, field names, payload keys) entre FE_CHANGES y BE_CHANGES. Si la spec tiene inconsistencias entre lados → ❓ Bloqueante antes de implementar
  - Previene desalineamientos detectados solo en producción cuando FE y BE implementan desde la misma doc con valores distintos

## [0.16.0] - 2026-06-09

### Added
- Installer: context7 agregado al setup — advertido como recomendado (no bloqueante) junto a Figma
  - Atlassian: requerido (bloquea /task si no está)
  - Figma + Context7: recomendados (mejoran el análisis; no bloquean la instalación)
- Skill `/task` v2.0.0: uso de context7 en paso 7 (viabilidad técnica) para verificar constraints de librerías contra docs oficiales
  - Si context7 no está disponible → `⚠️ Context7 ausente` en el brief cuando el task involucra tecnologías con límites no triviales

## [0.15.0] - 2026-06-09

### Changed
- Skill `/task` v2.0.0: reescritura completa — estructura coherente de 8 fases
  - **Fase 2**: viabilidad técnica unificada post-CodeGraph (scope real vs documentado, tecnología identificada, constraints, approach, prerequisites)
  - **Fase 3**: auditoría de ACs separada de la compilación del brief — dos pasos distintos
  - **Fase 7**: compilación obligatoria antes de verificar ACs — detecta errores de tipos antes de reportar tarea completa
  - Elimina fragmentación de checks de gaps (antes repartidos en pasos 4b, 7, 7-tech)
  - Numeración continua y limpia (1-18), sin "4b" ni pasos de parche

## [0.14.0] - 2026-06-09

### Added
- Skill `/task` v1.10.0: evaluación de viabilidad técnica del spec en Fase 1 (paso 4b)
  - Después de leer todos los docs pero antes de tocar CodeGraph, evalúa si la spec es implementable tal como está escrita
  - Detecta specs que describen solo el resultado sin el camino técnico, cambios aparentemente simples que podrían requerir muchos más cambios de los documentados, y prerequisites implícitos no mencionados
  - Si el spec es insuficiente → ❓ Bloqueante antes de continuar, no avanza sobre gaps asumiendo que se resuelven solos

## [0.13.0] - 2026-06-09

### Added
- Skill `/task` v1.9.0: auditoría de constraints técnicos en Fase 3
  - Primer check: ¿la tecnología específica está identificada en el spec? Si no está explícito (ej: "buscar usuarios" sin decir si es Typesense, Firestore o la API interna) → pregunta antes de asumir
  - Para cada operación técnica, verifica si hay límites conocidos que el spec no menciona (complejidad de query, rate limits, tamaños máximos, cuotas, versiones de API)
  - Detecta asunciones implícitas de "no hay límites" y comportamientos no obvios de la plataforma
  - Si la tecnología es poco familiar → pregunta al usuario antes de continuar, no asume
  - Misma clasificación que AC gaps: ❓ Bloqueante / ⚠️ Asumido

## [0.12.0] - 2026-06-09

### Added
- Skill `/task` v1.8.0: auditoría de gaps en ACs durante la compilación del brief
  - Por cada AC: detecta happy path only, validaciones sin reglas, entidades asumidas como existentes, contratos BE sin spec de compatibilidad mobile
  - Gaps bloqueantes → preguntas explícitas en el STOP del paso 8 antes de continuar
  - Gaps no bloqueantes → documentados como `⚠️ Asumido: <decisión>` en el brief
  - Sin gaps → silencioso

## [0.11.1] - 2026-06-08

### Changed
- `CLAUDE-base.md`: reescrito — unifica escepticismo, scope exacto, tipado; elimina redundancias con skills; fusiona Gate+Blast radius en una sección sin nombres de componentes específicos
- Skill `/task` v1.7.1: principio guía condensado (no repite CLAUDE-base.md); tabla de errores comunes reducida a 5 entradas no-obvias
- Skill `/spec` v1.3.1: ídem — principio guía acotado a lo spec-específico; tabla de errores reducida a 5 entradas no-obvias
- `templates/CLAUDE.md`: marcado como stale — el installer usa `CLAUDE-base.md`

## [0.11.0] - 2026-06-08

### Changed
- Skill `/task` v1.7.0 + `/spec` v1.3.0: principio de escepticismo reforzado
  - Reemplaza checklist de retro compat por asunción base: quien documentó no conocía todas las implicaciones técnicas
  - Aplica a specs escritos por humanos y por IA — especialmente en el segundo caso donde el texto suena completo sin serlo
  - El trabajo no es transcribir el FRD, es validar si es implementable, coherente y completo

## [0.10.0] - 2026-06-08

### Added
- Skill `/task` v1.6.0: check de retro compat en ejecución BE
  - Paso 12 sub-paso 3: si la tarea modifica un endpoint/request/response existente → verificar compatibilidad con clientes mobile actuales antes de implementar. Breaking change → STOP y proponer estrategia de versionado
- Skill `/spec` v1.2.0: retro compat como fuga de auditoría
  - Patrón de fuga nuevo: HU modifica contrato BE existente sin considerar versiones anteriores de la app mobile
  - Clasificado como bloqueante — necesita decisión explícita antes de documentar el cambio

## [0.9.0] - 2026-06-08

### Added
- Skill `/task` v1.5.0: alineamiento + verificación de rutas + Figma flag
  - Bloque "Entendimiento" en STOP del paso 8: objetivo, impacto técnico, fuera de scope — el usuario confirma antes de continuar
  - Paso 10: verificar rutas del plan con CodeGraph antes de presentarlo — no incluir archivos que no existen
  - "Por qué" en cada tarea del plan: motivo técnico visible, no solo qué archivo se toca
  - Paso 4: si task es FE y no hay Figma node-id → registrar como `⚠️ Figma ausente` en el brief
- Skill `/spec` v1.1.0: alineamiento + Figma + umbral de vaguedad + calidad de doc + Confluence update seguro
  - Fase "Alineamiento" obligatoria post-ingesta: resumen de entendimiento del FRD antes de cualquier análisis
  - Extracción de links Figma del FRD mapeados por HU
  - Umbral de vaguedad: HU con >50% de ACs bloqueantes → marcar como no lista para spec
  - Tabla de archivos con columna "Por qué": razonamiento visible en cada cambio
  - Fase 6 segura: leer cuerpo completo → identificar sección → reemplazar solo esa parte → resubmitir todo
  - Fase 4 de clarificación: explica el impacto técnico de cada pregunta para que el usuario entienda por qué importa

## [0.8.0] - 2026-06-08

### Added
- Skill `/task` v1.4.0: leer archivo objetivo antes de ejecutar
  - Sub-paso explícito: leer el archivo antes de tocar nada, entender estado actual y patrones
  - Si el estado real difiere del plan → STOP antes de escribir una línea

### Changed
- Skill `/spec` v1.0.0: estándares de calidad de documentación reforzados
  - Archivos: rutas verificadas, descripción específica del cambio (no genérica)
  - Contratos TypeScript: interfaces completas con campos base + nuevos marcados, no esqueletos
  - ACs: estado inicial → acción → resultado esperado, casos de error incluidos

## [0.7.0] - 2026-06-08

### Added
- Nuevo skill `/spec` v1.0.0: FRD → Spec Técnica + backlog de Jira
  - Auditoría activa de fugas en docs generados con IA (ACs genéricos, estados de error ausentes, validaciones vagas, happy path only, contradicciones inter-sección)
  - CodeGraph integration: mapeo de impacto por HU antes de documentar cualquier cambio
  - Respeta el documento base — solo toca la sección de cambios técnicos
  - Clarificación socrática solo para gaps que bloquean decisiones técnicas
  - Backlog Jira opcional con STOP antes de crear tickets

## [0.6.0] - 2026-06-08

### Added
- Skill `/task` v1.3.0: principio de senior behavior
  - Sección "Principio guía" explícita: reportar gaps del spec, proponer alternativas ante blast radius alto, cuestionar antes de ejecutar cuando algo no cuadra
  - 3 entradas nuevas en "Errores comunes": spec incompleto sin preguntar, blast radius ignorado, verificación superficial
- CLAUDE.md: regla `Senior behavior` en la sección General — aplica a todos los skills y flujos del asistente

## [0.5.0] - 2026-06-08

### Added
- Skill `/task` v1.2.0: flujo git completo integrado al proceso
  - **Fase 4 — Contexto git**: verifica rama y cambios sin commitear antes de tocar código. Sugiere nombre de rama `CV-XXX/descripción` y pide confirmación si hay que crearla
  - **Fase 8 — Cierre**: pregunta si hacer push, luego si abrir PR. PR generado con título, descripción del brief y checklist de ACs

## [0.4.0] - 2026-06-08

### Added
- Skill `/task` v1.1.0: fases Plan + Ejecución + Verificación (Atomic es ahora spec-driven end-to-end)
  - **Fase 4 — Plan**: tareas atómicas ordenadas por dependencia, STOP antes de ejecutar
  - **Fase 5 — Ejecución**: una tarea a la vez, commit atómico por tarea, protocolo de desviaciones
  - **Fase 6 — Verificación**: goal-backward contra ACs del brief, no se reporta completo hasta ✅ todos

## [0.3.0] - 2026-06-08

### Added
- Pre-push hook que verifica version bump + entrada en CHANGELOG al modificar skills
- Hook versionado en `packages/cli/hooks/pre-push`, instalable con `npm run setup-dev`
- Script `setup-dev` en `package.json` para instalar hooks de desarrollo

## [0.2.0] - 2026-06-08

### Added
- Skill versioning: `version` field in SKILL.md frontmatter
- Installer shows skill version on install (`✓ skill /task v1.0.0`)
- i18n consistency rule: capitalización y formato deben ser consistentes entre todos los locales

### Changed
- Frontend Angular rules refactored: principios genéricos en lugar de nombres de componentes específicos del codebase
- Implicit Angular rules now explicit: async pipe, trackBy, lazy loading, aria-label, Figma pixel-perfect, i18n obligatorio

## [0.1.0] - 2026-06-07

### Added
- Skill `/task`: discovery completo de Jira → HU → Spec Técnica → FRD → Figma
- Pre-flight MCP check con instrucciones de setup para Atlassian y Figma
- STOP obligatorio en paso 8 antes de implementar
- Installer (`curl | node` y `npx github:antony-hernandez/atomic`)
- CLAUDE.md con delimitadores `<!-- ATOMIC:START/END -->` para merge seguro
- Detección automática de tipo de proyecto desde `package.json`
- Templates modulares por stack: `frontend-angular.md`, `backend-cf.md`, `mobile-rn.md`
- MCP CodeGraph configurado automáticamente en `.claude/settings.json`
- Warning de setup pendiente si faltan MCPs de Atlassian o Figma
