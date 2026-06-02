# Atomic

**El asistente de desarrollo de Atom.** Spec-driven, enfocado, sin fricción.

Das un ID de tarea → Atomic lee Jira, sube a la HU, va a Confluence, encuentra el FRD, saca el Figma correcto, verifica qué ya existe en el codebase, y te entrega un brief listo para implementar. Sin inventar nada. Sin perder el foco.

---

## Instalación

### Opción 1 — Claude lo instala por ti (recomendado)

Desde cualquier proyecto en Claude Code, escribe:

```
instala Atomic en este proyecto desde https://github.com/atomchat/atomic
```

Claude descarga los skills, configura los MCPs y actualiza el CLAUDE.md.

### Opción 2 — curl

```bash
curl -fsSL https://raw.githubusercontent.com/atomchat/atomic/main/packages/cli/src/install.mjs | node
```

### Opción 3 — npx

```bash
npx github:atomchat/atomic
```

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
4. Si hay FRD → lo lee (con comentarios) y extrae el Figma específico de la HU
5. Consulta CodeGraph → qué ya existe en el codebase que puedes reusar
6. Entrega un brief enfocado: FE o BE, nunca los dos mezclados

---

## MCPs requeridos

| MCP | Para qué | Cómo instalar |
|-----|----------|---------------|
| **Atlassian** | Jira + Confluence | [claude.ai/settings](https://claude.ai/settings) → Integrations → Atlassian |
| **Figma** | Diseños por HU | [claude.ai/settings](https://claude.ai/settings) → Integrations → Figma |
| **CodeGraph** | Navegación del codebase sin leer archivos | Configurado automáticamente por el installer |

---

## Skills disponibles

| Skill | Descripción |
|-------|-------------|
| `/task <ID>` | Brief completo de una tarea de Jira — discovery, contexto, reuso, criterios |

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

**Foco de tarea:** si el task dice `[BACKEND]`, el brief es de backend aunque el spec tenga secciones de frontend. El dev trabaja una sola cosa.

---

## Reglas del codebase (Atom)

- Reusar antes de crear — CodeGraph verifica si ya existe antes de escribir una línea
- Sin `any` — tipado estricto siempre
- Sin features no pedidas — exactamente lo que dice el spec
- Verificar al terminar — criterios de aceptación confrontados uno por uno

---

## Contribuir

El repo es público. PRs bienvenidos para nuevos skills, mejoras al pipeline, o soporte para otras herramientas (Cursor, Copilot, Gemini CLI).

```
.claude/skills/task/SKILL.md   ← skill principal
packages/cli/src/install.mjs   ← installer
packages/cli/templates/        ← archivos que se copian al instalar
CLAUDE.md                      ← contexto base del proyecto
```
