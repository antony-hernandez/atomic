# Atom Developer Skills

**El asistente de desarrollo de Atom.** Spec-driven, enfocado, sin fricción.

Das un ID de tarea → ADS lee Jira, sube a la HU, va a Confluence, encuentra el FRD, saca el Figma correcto, verifica qué ya existe en el codebase, y te entrega un brief listo para implementar. Sin inventar nada. Sin perder el foco.

---

## Instalación

### Opción recomendada — dejá que el agente lo haga

Desde cualquier proyecto en Claude Code, escribe:

```
instala ADS en este proyecto desde https://github.com/antony-hernandez/atom-developer-skills
```

Claude descarga los skills, configura los MCPs y actualiza el CLAUDE.md.


El installer:
- Copia los skills `ads:task` y `ads:spec` en `.claude/skills/`
- Crea o actualiza `CLAUDE.md` con la sección ADS delimitada (no sobreescribe tu contenido existente)
- Configura el MCP de CodeGraph en `.claude/settings.json`
- Avisa qué MCPs de terceros quedan pendientes de conectar

---

## MCPs requeridos

| MCP | Para qué | Cómo instalar |
|-----|----------|---------------|
| **Atlassian** | Jira + Confluence — sin esto `ads:task` no funciona | [claude.ai/settings](https://claude.ai/settings) → Integrations → Atlassian |
| **Figma** | Diseños por HU | [claude.ai/settings](https://claude.ai/settings) → Integrations → Figma |
| **Context7** | Documentación oficial de librerías para viabilidad técnica | [claude.ai/settings](https://claude.ai/settings) → Integrations → Context7 |
| **CodeGraph** | Navegación del codebase | Configurado automáticamente por el installer |

---

## Uso

```
ads:task CV-123
```

Eso es todo. ADS hace el resto.

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

**El punto donde otras IAs se pierden:** el FRD tiene un archivo de Figma con node-ids distintos por HU. ADS identifica la HU correcta y extrae el frame exacto, no el link genérico del header.

**Foco de tarea:** si el task dice `[BACKEND]`, el brief es de backend aunque el spec tenga secciones de frontend.

---

## Skills disponibles

| Skill | Descripción |
|-------|-------------|
| `ads:task <ID>` | Brief completo de una tarea de Jira — discovery, cross-check FE↔BE, viabilidad técnica, reuso, criterios |
| `ads:spec <URL_FRD>` | Convierte un FRD en Spec Técnica + backlog de Jira |

---

## Estructura del repo

```
.claude-plugin/
  plugin.json              ← plugin manifest (name: ads)
skills/
  task/
    SKILL.md               ← skill ads:task
    brief-template.md      ← template del brief
  spec/
    SKILL.md               ← skill ads:spec
packages/cli/
  src/install.mjs          ← installer (curl | node y npx)
  templates/
    CLAUDE-base.md         ← base que se instala en el proyecto
    sections/
      frontend-angular.md  ← reglas Angular
      backend-cf.md        ← reglas Cloud Functions
      mobile-rn.md         ← reglas React Native
  hooks/
    pre-push               ← verifica changelog al pushear
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
