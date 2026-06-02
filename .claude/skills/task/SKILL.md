---
name: task
description: Dado un ID de tarea de Jira (subtask), arma el contexto completo de implementación — lee Jira, sube a la HU padre, va a Confluence, encuentra el FRD, extrae Figma si aplica, y entrega un brief enfocado en el tipo de tarea (FE o BE). Nunca asume. Siempre pregunta lo que falta.
---

# Atomic — Task Discovery

<rules>
- NUNCA inventar información que no está en los documentos leídos
- NUNCA mezclar contexto FE y BE en el brief — el dev trabaja una sola cosa
- NUNCA asumir el tipo de tarea si no hay prefijo claro — preguntar
- SIEMPRE leer comentarios: Jira (task + HU) y Confluence (Spec + FRD)
- SIEMPRE seguir la cadena completa antes de entregar el brief
- Si faltan criterios de aceptación en la tarea → exigirlos antes de continuar
- Usar `responseContentFormat: markdown` en todos los calls a Jira
- Cloud ID de Atom: `atomchat.atlassian.net`
</rules>

## Paso 1 — Fetch del task dado

```
getJiraIssue(
  cloudId: "atomchat.atlassian.net",
  issueIdOrKey: <ID>,
  responseContentFormat: "markdown",
  fields: ["summary", "description", "parent", "comment", "status", "assignee", "issuetype"]
)
```

**Detectar tipo de tarea** desde el `summary`:
- Contiene `[FRONTEND]` → `TASK_TYPE = FE`
- Contiene `[BACKEND]` → `TASK_TYPE = BE`
- Ninguno → **preguntar al usuario antes de continuar**: "¿Esta tarea es de frontend o backend?"

**Verificar criterios de aceptación** en la descripción del task:
- Si no hay criterios de aceptación → **detener y exigir**: "Esta tarea no tiene criterios de aceptación definidos. Sin ellos no puedo asegurar que la implementación cumpla lo pedido. ¿Puedes agregarlos o indicarme dónde encontrarlos?"

**Guardar** si hay comentarios en el task (`comment.total > 0`): se incluirán en el brief.

## Paso 2 — Subir a la HU padre

Si `fields.issuetype.hierarchyLevel === -1` (subtask), usar `fields.parent.key` como HU.

```
getJiraIssue(
  cloudId: "atomchat.atlassian.net",
  issueIdOrKey: <parentKey>,
  responseContentFormat: "markdown",
  fields: ["summary", "description", "comment"]
)
```

**Extraer de la descripción de la HU** el "Documento fuente":
- Buscar patrón `wiki/x/<tinyId>` → usar `tinyId` como `pageId`
- Buscar patrón `wiki/spaces/.*/pages/(\d+)` → usar el número como `pageId`
- Si no hay link → buscar el spec en Confluence por título usando el nombre de la HU. Si tampoco → **preguntar**: "No encontré el documento fuente. ¿Tienes el link al spec de Confluence?"

**Guardar** comentarios del padre si los hay.

## Paso 3 — Leer la Spec Técnica en Confluence

```
getConfluencePage(cloudId: "atomchat.atlassian.net", pageId: <id>, contentFormat: "markdown")
getConfluencePageFooterComments(cloudId: "atomchat.atlassian.net", pageId: <id>)
getConfluencePageInlineComments(cloudId: "atomchat.atlassian.net", pageId: <id>)
```

**Extraer según `TASK_TYPE`:**

Si `TASK_TYPE = FE`:
- Tabla de cambios técnicos de Frontend (archivos, métodos, tipo: Validar/Implementar/Analizar)
- Criterios de aceptación técnicos relevantes a FE
- Checklist de verificación E2E de FE

Si `TASK_TYPE = BE`:
- Tabla de cambios técnicos de Backend (archivos, métodos, tipo)
- Criterios de aceptación técnicos relevantes a BE
- Checklist de verificación E2E de BE

**Buscar en el body de la Spec** un link a FRD:
- Patrón: `[FRD...](https://...pages/<id>)` o cualquier link con "FRD" en el texto
- Si existe → ir al Paso 4. Si no → saltar al Paso 5.

## Paso 4 — Leer el FRD (si existe)

```
getConfluencePage(cloudId: "atomchat.atlassian.net", pageId: <frdId>, contentFormat: "markdown")
getConfluencePageFooterComments(cloudId: "atomchat.atlassian.net", pageId: <frdId>)
getConfluencePageInlineComments(cloudId: "atomchat.atlassian.net", pageId: <frdId>)
```

**Identificar la HU en el FRD**: el summary de la HU padre contiene algo como `HU-06` o `HU-01`. Buscar la sección `### HU-XX |` correspondiente en el FRD.

**Si `TASK_TYPE = FE`**: extraer de esa sección específica:
- El link de **Figma** (no el del header general — el del bloque de la HU específica)
- Los criterios de aceptación funcionales de esa HU
- Cualquier nota de diseño relevante

**Guardar** comentarios del FRD (footer + inline) — frecuentemente contienen decisiones de PM/diseño post-spec.

## Paso 4.5 — Cross-check FRD vs HU/Task

Antes de armar el brief, comparar lo que dice cada fuente sobre los criterios de aceptación y el alcance de la tarea.

**Qué buscar:**

1. **Criterio en FRD que contradice al task/HU** — el FRD dice "X debe hacer Y" pero el task dice "X debe hacer Z"
2. **Criterio en FRD que no aparece en el task** — el FRD menciona algo que el task ignora completamente (señal de que el task está desactualizado)
3. **Criterio en el task que no aparece en el FRD** — el task pide algo que el FRD no contempla (posible scope creep o task mal escrito)

**Regla de prioridad por defecto:** el FRD es la fuente de verdad funcional. Fue revisado por PM, PO y diseño. El task puede quedar desactualizado cuando el FRD evoluciona.

**Si no hay mismatches:** continuar silencioso al Paso 5.

**Si hay mismatches:** interrumpir y presentar al usuario antes de continuar:

```
⚠️  ATOMIC ► DISCREPANCIAS DETECTADAS
───────────────────────────────────────────────────────────────

Encontré diferencias entre el FRD y el task/HU. Antes de armar
el brief, necesito saber cuál fuente seguir:

MISMATCH 1:
  FRD dice   : <cita exacta del FRD>
  Task/HU dice: <cita exacta del task o HU>
  → ¿Cuál es correcto?

MISMATCH 2:
  FRD menciona: <algo que no está en el task>
  Task: no lo cubre
  → ¿Lo incluyo en el brief?

[... un bloque por mismatch ...]

───────────────────────────────────────────────────────────────
Responde por número o dime si el FRD gana en todos los casos.
```

Incorporar las respuestas del usuario al brief. Documentar los mismatches detectados en la sección **PREGUNTAS / INFO FALTANTE** del brief para que quede registro.

## Paso 5 — Compilar el brief

Presentar en este formato:

```
═══════════════════════════════════════════════════════════════
 ATOMIC ► BRIEF DE TAREA
═══════════════════════════════════════════════════════════════

Task  : <KEY> — <summary>
Tipo  : FRONTEND | BACKEND
Estado: <status>
HU    : <parentKey> — <parentSummary>

───────────────────────────────────────────────────────────────
 CONTEXTO
───────────────────────────────────────────────────────────────
<Historia de usuario: Como / Quiero / Para>
<Objetivo de la HU en 2-3 líneas>

───────────────────────────────────────────────────────────────
 FIGMA                          (solo si TASK_TYPE = FE y existe)
───────────────────────────────────────────────────────────────
<Link Figma específico de la HU — node-id exacto>
Nota: este es el frame específico de <HU-XX>, no el archivo general.

───────────────────────────────────────────────────────────────
 QUÉ CONSTRUIR
───────────────────────────────────────────────────────────────
<Tabla de cambios técnicos filtrada por TASK_TYPE>
| # | Qué | Archivo / Método | Detalle | Tipo |
|---|-----|-----------------|---------|------|

───────────────────────────────────────────────────────────────
 CRITERIOS DE ACEPTACIÓN
───────────────────────────────────────────────────────────────
Funcionales (del FRD / HU):
- [ ] ...

Técnicos (de la Spec):
- [ ] ...

Del task (los que ya estaban en Jira):
- [ ] ...

───────────────────────────────────────────────────────────────
 DECISIONES Y CONTEXTO (de comentarios)
───────────────────────────────────────────────────────────────
<Solo si hay comentarios relevantes en Jira o Confluence>
[<Autor> — <fecha>]: <contenido relevante>

───────────────────────────────────────────────────────────────
 VERIFICACIÓN — antes de dar por terminado
───────────────────────────────────────────────────────────────
<Checklist E2E específico del tipo de tarea>
- [ ] ...

───────────────────────────────────────────────────────────────
 PREGUNTAS / INFO FALTANTE
───────────────────────────────────────────────────────────────
<Listar explícitamente cualquier ambigüedad o información que
 no se encontró en los documentos. Si no hay → "Ninguna — el
 spec es suficiente para comenzar.">
```

## Paso 6 — Alineación antes de implementar

Después de entregar el brief, preguntar:

> ¿Tienes alguna duda o hay algo que ajustar antes de empezar?

Si el usuario dice que sí → resolver antes de tocar código.
Si el usuario dice que no → comenzar la implementación siguiendo estrictamente los criterios del brief.

## Paso 6.5 — Gate de reuso con CodeGraph (ANTES de escribir código)

**Regla:** ningún archivo, clase, función, o enum nuevo puede proponerse hasta que CodeGraph confirme que no existe.

Para cada elemento mencionado en la tabla "QUÉ CONSTRUIR" del brief — componentes, enums, servicios, mappers, validators — ejecutar en paralelo:

```
codegraph_search(query: "<NombreExacto>")           // ¿existe?
codegraph_context(task: "<descripción del elemento>") // ¿cómo funciona lo relacionado?
```

Ejecutar todas las queries del gate en paralelo. No escribir código hasta tener los resultados.

**Queries mínimas por tipo de tarea:**

Si `TASK_TYPE = FE`:
- Cada enum nuevo: `codegraph_search("<EnumName>")`
- Cada componente nuevo: `codegraph_context("<feature> <component-name>")`
- Cada servicio nuevo: `codegraph_search("<ServiceName>")`
- Siempre: `codegraph_search("audience-condition.mapper")` si el task toca audiencias
- Siempre: `codegraph_context("<feature> condition-row")` si el task toca el builder

Si `TASK_TYPE = BE`:
- Cada ConditionType nuevo: `codegraph_search("ConditionType")`
- Cada use-case nuevo: `codegraph_context("<feature> usecase")`
- Siempre: `codegraph_search("filter-condition-group-schema")` si toca validaciones Joi
- Siempre: `codegraph_search("on-update")` si toca triggers de conversación

Agregar al brief la sección **REUSO**:
```
───────────────────────────────────────────────────────────────
 REUSO — lo que ya existe y debes usar
───────────────────────────────────────────────────────────────
✅ <NombreComponente> — ya existe en <ruta> — úsalo, no lo crees
✅ <NombreUtility> — ya existe en <ruta>
⚠️  <NombreCosa> — no existe, crear siguiendo el patrón de <análogo>
```

Si algo "no existe", buscar el análogo más cercano en CodeGraph y referenciarlo en el brief como patrón a seguir.

**Regla adicional — impacto antes de modificar:**

Antes de modificar cualquier componente existente (especialmente estilos, estructura de template, o @Input/Output), verificar su blast radius:

```
codegraph_impact(symbol: "<NombreComponente>")
```

Si el componente es usado en más de 3 lugares → **no modificar directamente**. En su lugar:
- Agregar un `@Input()` nuevo que active el comportamiento diferente (sin afectar usos existentes)
- Crear un componente nuevo que extienda o envuelva el existente
- Agregar una clase CSS nueva en lugar de modificar la existente

Agregar al brief bajo REUSO:
```
⚠️  <NombreComponente> — se usa en <N> lugares — no modificar estilos/estructura directamente
    Estrategia: <@Input nuevo | componente wrapper | clase CSS aditiva>
```

## Durante la implementación

- **No agregar nada que no esté en el brief** — si surge algo que parece necesario pero no está en el spec, pausar y preguntar
- **Reusar lo que CodeGraph encontró** — si existe, úsalo. Nunca reinventar.
- **Mantener tipado** — no usar `any`, no romper tipos existentes
- **Deliverables pequeños** — implementar por chunks verificables, no todo de una vez
- **Navegar el código con CodeGraph, no leyendo archivos** — `codegraph_context` antes de `Read`
- **Al terminar**: confrontar la implementación contra los criterios del brief ítem por ítem antes de reportar como completo
