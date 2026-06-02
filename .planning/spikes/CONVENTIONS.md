# Spike Conventions

Patrones y decisiones de stack establecidos en sesiones de spike. Los nuevos spikes siguen estas convenciones salvo que la pregunta requiera otra cosa.

## Stack

- **Runtime principal**: el agente mismo (Claude) usando MCPs — no scripts Node.js separados
- **Integración Atlassian**: `mcp__plugin_atlassian_atlassian__*` — ya instalado, autenticado, sin setup adicional
- **Integración Figma**: `mcp__plugin_figma_figma__*` — disponible cuando aplica
- **CodeGraph**: `mcp__codegraph__*` — para navegación del codebase de Atom (7565+ archivos indexados)
- **Formato Jira**: siempre `responseContentFormat: "markdown"` — más fácil de parsear que ADF

## Qué "construir" en spikes de Atomic

Los spikes de Atomic no producen código ejecutable separado — producen **comportamiento del agente validado con datos reales de Jira/Confluence**. El "build" es ejecutar el pipeline con un task ID real y observar el output.

Esto difiere del workflow GSD estándar (que asume un script o UI). Para spikes de este tipo:
- El experimento es una ejecución del pipeline en vivo
- La verificación requiere checkpoint humano ("¿el resultado es correcto?")
- El README documenta el trail de investigación, no un `How to Run` con comandos

## Estructura de un spike de Atomic

```
.planning/spikes/NNN-nombre/
  README.md   ← pipeline ejecutado, hallazgos, limitaciones
  (no hay código adicional — el experimento vive en la sesión)
```

## Proceso — ajustes al workflow GSD para este proyecto

El workflow GSD estándar asume spikes de código. Atomic usa spikes de comportamiento. Diferencias:

| Paso GSD | Ajuste para Atomic |
|----------|-------------------|
| Research (enfoques alternativos) | Aplica: documentar variantes consideradas del diseño |
| Build con UI/CLI | No aplica: el experimento es una ejecución en vivo del pipeline |
| Forensic log | Aplica: documentar el trail completo (qué fetches, qué encontró en cada fuente) |
| Checkpoint humano | **Obligatorio** — el agente no puede declarar VALIDATED solo; el usuario debe confirmar |
| `gsd_run query commit` | No disponible en este repo; usar `git commit` directo |

## Reglas que emergieron de los spikes

- **El link al spec no está en remote links de Jira** — está en el body como texto (`Documento fuente:` o sección `## Confluence`)
- **FRD gana como fuente funcional, pero no automáticamente** — el agente pregunta cuando hay mismatch porque el dev puede tener contexto verbal no documentado
- **Las decisiones de reunión no llegan a los docs** — el cross-check detecta discrepancias escritas; la resolución es siempre del humano
- **Cloud ID de Atlassian**: `atomchat.atlassian.net` — en todos los calls

## Patrones de naming en Atom (para parsear documentos)

- `[FRONTEND]` / `[BACKEND]` en summary del subtask → tipo de tarea
- `Documento fuente: <url>` en body de HU → link al spec
- `## Confluence\n<url>` en body de HU → variante del link al spec
- `wiki/x/<tinyId>` → tiny link de Confluence (usar como pageId)
- `wiki/spaces/.../pages/<id>` → link directo (usar el número como pageId)
- `HU-01`, `HU-06` en nombres de HU → número para matchear en el FRD
