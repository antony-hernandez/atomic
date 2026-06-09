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
