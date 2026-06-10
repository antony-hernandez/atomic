# Contributing to Atom Developer Skills

## Setup de desarrollo

```bash
git clone https://github.com/antony-hernandez/atom-developer-skills
cd atom-developer-skills
npm run setup-dev   # instala el pre-push hook
```

## Estructura

```
.claude-plugin/
  plugin.json              ← plugin manifest
skills/
  task/SKILL.md            ← skill ads:task
  spec/SKILL.md            ← skill ads:spec
packages/cli/
  src/install.mjs          ← installer
  templates/sections/      ← reglas por stack
  hooks/pre-push           ← git hook de validación
CHANGELOG.md
```

## Modificar un skill existente

1. Editar el archivo en `skills/<nombre>/SKILL.md`
2. Agregar entrada en `CHANGELOG.md` bajo `## [x.y.z] - YYYY-MM-DD`
3. Bump de `version` en `package.json` raíz siguiendo semver:
   - **PATCH** (`1.0.x`): wording, typo, mejora de ejemplo
   - **MINOR** (`1.x.0`): regla nueva, sección nueva, paso nuevo
   - **MAJOR** (`x.0.0`): workflow restructurado, paso removido

El pre-push hook bloquea el push si falta alguno de estos pasos.

## Agregar un skill nuevo

1. Crear `skills/<nombre>/SKILL.md` con frontmatter:
   ```yaml
   ---
   name: <nombre>
   description: Use when [condición de disparo, no resumen del workflow]
   ---
   ```
2. Registrar la copia en el installer (`packages/cli/src/install.mjs`): agregar la entrada en el array `skills` dentro de `install()`
3. Bump MINOR en `package.json`
4. Entrada en `CHANGELOG.md`

## Agregar una sección de stack

1. Crear `packages/cli/templates/sections/<stack>.md`
2. Agregar detección en `detectProjectTypes()` en el installer
3. Agregar label en `SECTION_LABELS`
4. Bump MINOR en `package.json` + entrada en `CHANGELOG.md`

## Convención de commits

```
feat(scope):     nueva funcionalidad
fix(scope):      corrección de bug
docs(scope):     solo documentación
chore(scope):    mantenimiento, bumps de versión
refactor(scope): refactor sin cambio de comportamiento
```

## Pull requests

- Un PR por cambio lógico
- El título sigue la convención de commits
- Incluir descripción de qué cambia y por qué
- El CI (pre-push hook) debe pasar localmente antes de abrir el PR
