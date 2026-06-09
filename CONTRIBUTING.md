# Contributing to Atomic

## Setup de desarrollo

```bash
git clone https://github.com/antony-hernandez/atomic
cd atomic
npm run setup-dev   # instala el pre-push hook
```

## Estructura

```
packages/cli/
  src/install.mjs          ← installer
  templates/skills/task/   ← skill /task (versionado)
  templates/sections/      ← reglas por stack
  hooks/pre-push           ← git hook de validación
CHANGELOG.md
```

## Modificar un skill existente

1. Editar el archivo en `packages/cli/templates/skills/<nombre>/SKILL.md`
2. Bump de `version` en el frontmatter siguiendo semver:
   - **PATCH** (`1.0.x`): wording, typo, mejora de ejemplo
   - **MINOR** (`1.x.0`): regla nueva, sección nueva, paso nuevo
   - **MAJOR** (`x.0.0`): workflow restructurado, paso removido
3. Bump de `version` en `package.json` raíz (MINOR si skill MINOR/PATCH, MAJOR si skill MAJOR)
4. Agregar entrada en `CHANGELOG.md` bajo `## [x.y.z] - YYYY-MM-DD`

El pre-push hook bloquea el push si falta alguno de estos pasos.

## Agregar un skill nuevo

1. Crear `packages/cli/templates/skills/<nombre>/SKILL.md` con frontmatter:
   ```yaml
   ---
   name: <nombre>
   version: 1.0.0
   description: Use when [condición de disparo, no resumen del workflow]
   ---
   ```
2. Registrar la copia en el installer (`packages/cli/src/install.mjs`)
3. Bump MINOR en `package.json`
4. Entrada en `CHANGELOG.md`

## Agregar una sección de stack

1. Crear `packages/cli/templates/sections/<stack>.md`
2. Agregar detección en `detectProjectTypes()` en el installer
3. Agregar label en `SECTION_LABELS`
4. Bump MINOR en `package.json` + entrada en `CHANGELOG.md`

## Convención de commits

```
feat(scope):   nueva funcionalidad
fix(scope):    corrección de bug
docs(scope):   solo documentación
chore(scope):  mantenimiento, bumps de versión
refactor(scope): refactor sin cambio de comportamiento
```

## Pull requests

- Un PR por cambio lógico
- El título sigue la convención de commits
- Incluir descripción de qué cambia y por qué
- El CI (pre-push hook) debe pasar localmente antes de abrir el PR
