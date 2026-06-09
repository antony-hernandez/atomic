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
