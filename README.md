# Atomic

**El asistente de desarrollo de Atom.** Spec-driven, enfocado, sin fricción.

Das un ID de tarea → Atomic lee Jira, sube a la HU, va a Confluence, encuentra el FRD, saca el Figma correcto, verifica qué ya existe en el codebase, y te entrega un brief listo para implementar. Sin inventar nada. Sin perder el foco.

---

## Instalación

### Opción 1 — Claude lo instala por ti (recomendado)

Desde cualquier proyecto en Claude Code, escribe:

```
instala Atomic en este proyecto desde https://github.com/antony-hernandez/atomic
```

Claude descarga los skills, configura los MCPs y actualiza el CLAUDE.md.

### Opción 2 — curl

```bash
curl -fsSL https://raw.githubusercontent.com/antony-hernandez/atomic/main/packages/cli/src/install.mjs | node
```

### Opción 3 — npx

```bash
npx github:antony-hernandez/atomic
```

El installer:
- Copia el skill `/task` en `.claude/skills/task/`
- Crea o actualiza `CLAUDE.md` con la sección Atomic delimitada (no sobreescribe tu contenido existente)
- Configura el MCP de CodeGraph en `.claude/settings.json`
- Avisa qué MCPs de terceros quedan pendientes de conectar

---

## MCPs requeridos

| MCP | Para qué | Cómo instalar |
|-----|----------|---------------|
| **Atlassian** | Jira + Confluence | [claude.ai/settings](https://claude.ai/settings) → Integrations → Atlassian |
| **Figma** | Diseños por HU | [claude.ai/settings](https://claude.ai/settings) → Integrations → Figma |
| **CodeGraph** | Navegación del codebase | Configurado automáticamente por el installer |

---

## Uso

```
/task CV-123
```

Eso es todo. Atomic hace el resto.

**Qué pasa internamente:**
1. Lee el task de Jira (con comentarios)
2. Sube al padre → HU
3. Parsea el "Documento fuente" → Spec Técnica en Confluence (con comentarios)
4. Si hay FRD → lo lee y extrae el Figma específico de la HU
5. Consulta CodeGraph → qué ya existe en el codebase para reusar
6. Entrega un brief enfocado: FE o BE, nunca los dos mezclados
7. **Para** y pregunta si ajustar antes de implementar — nunca arranca solo

---

## Cómo funciona el discovery

```
CV-599 (Development subtask)
  └── CV-598 (Historia — padre)
       └── "Documento fuente" en la descripción → Spec Técnica (Confluence)
            ├── Comentarios inline y footer
            └── Link al FRD → FRD completo (Confluence)
                 ├── Comentarios inline y footer
                 └── Figma — node-id específico de la HU, no el genérico
```

**El punto donde otras IAs se pierden:** el FRD tiene un archivo de Figma con node-ids distintos por HU. Atomic identifica la HU correcta y extrae el frame exacto, no el link genérico del header.

**Foco de tarea:** si el task dice `[BACKEND]`, el brief es de backend aunque el spec tenga secciones de frontend.

---

## Skills disponibles

| Skill | Versión | Descripción |
|-------|---------|-------------|
| `/task <ID>` | v1.0.0 | Brief completo de una tarea de Jira — discovery, contexto, reuso, criterios |

---

## Estructura del repo

```
packages/cli/
  src/install.mjs          ← installer (curl | node y npx)
  templates/
    CLAUDE-base.md         ← base que se instala en el proyecto
    skills/task/
      SKILL.md             ← skill principal (versionado)
      brief-template.md    ← template del brief
    sections/
      frontend-angular.md  ← reglas Angular
      backend-cf.md        ← reglas Cloud Functions
      mobile-rn.md         ← reglas React Native
  hooks/
    pre-push               ← verifica versioning + changelog al pushear
CHANGELOG.md               ← historial de versiones
```

---

## Reglas del codebase instaladas

El installer agrega reglas al `CLAUDE.md` del proyecto según el stack detectado en `package.json`:

- **Angular**: i18n obligatorio, Figma pixel-perfect, suscripciones con `takeUntil`, OnPush, async pipe, trackBy, lazy loading, aria-label
- **Cloud Functions**: validaciones Joi, compatibilidad legacy, errores tipados, una responsabilidad por función
- **React Native**: design system primero, estado local + Context, cleanup en useEffect, useCallback/useMemo

---

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo completo.

PRs bienvenidos para nuevos skills, mejoras al pipeline, o soporte para otras herramientas (Cursor, Copilot, Gemini CLI).
