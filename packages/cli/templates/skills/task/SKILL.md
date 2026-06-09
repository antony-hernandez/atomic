---
name: task
version: 1.1.0
description: Use when starting work on any Jira task — before reading code, writing code, or asking the user for context.
---

# Task Discovery

Dado un ID de Jira (task o HU), arma el contexto completo y ejecuta la implementación en fases. Sigue las fases en orden. No leer código ni preguntar al usuario hasta terminar el discovery.

## Pre-flight — verificar MCPs antes de empezar

Llamar `atlassianUserInfo()`. Si falla o no está disponible → **detener** y mostrar:

```
❌ MCP de Atlassian no está conectado.

Para usar /task necesitás conectarlo primero:
  1. Abrí claude.ai/settings
  2. Andá a Integrations
  3. Buscá "Atlassian" y hacé clic en Connect
  4. Autenticá con tu cuenta de Atom (antony.hernandez@atomchat.io)
  5. Reiniciá esta sesión de Claude Code

Sin este MCP, el skill no puede leer Jira ni Confluence.
```

No continuar hasta que el pre-flight pase.

## Fase 1 — Discovery (en paralelo donde sea posible)

**1. Task** — `getJiraIssue(cloudId: "atomchat.atlassian.net", issueIdOrKey, responseContentFormat: "markdown", fields: ["summary","description","parent","comment","issuetype"])`
- `[FRONTEND]` en summary → `TASK_TYPE = FE` / `[BACKEND]` → BE / ninguno → preguntar
- Sin criterios de aceptación → detenerse y exigirlos antes de continuar

**2. HU padre** — si `hierarchyLevel === -1`, fetch del `parent.key`. Buscar "Documento fuente" en body: `wiki/x/<tinyId>` o `wiki/spaces/.../pages/<id>`.

**3. Spec técnica** — `getConfluencePage` + footer comments + inline comments (en paralelo). Extraer cambios técnicos y criterios filtrados por `TASK_TYPE`. Buscar link a FRD en el body.

**4. FRD** (si existe) — `getConfluencePage` + comentarios. Identificar sección `### HU-XX` correspondiente. Extraer Figma node-id específico de esa sección (FE) y criterios funcionales.

## Fase 2 — Análisis

**5. Cross-check** — comparar criterios del FRD vs task/HU. Si hay mismatches → presentar al usuario y resolver antes de continuar. Si no → silencioso.

**6. Gate de reuso** — aplicar las reglas de `## Implementación` en CLAUDE.md. Resultados van en la sección REUSO del brief.

## Fase 3 — Brief

**7.** Compilar brief usando `brief-template.md`. Incluir sección REUSO.

**8.** STOP — presentar el brief completo y preguntar explícitamente: _"¿Algo que ajustar antes de empezar?"_ No continuar hasta recibir respuesta.

## Fase 4 — Plan de implementación

**9.** Generar lista de tareas atómicas ordenadas por dependencia. Formato exacto:

```
[ ] T1: <descripción del cambio> — `path/al/archivo.ts` (modify)
[ ] T2: <descripción del cambio> — `path/al/archivo.ts` (modify) ← depende de T1
[ ] T3: <descripción del cambio> — `path/al/archivo.spec.ts` (create)
```

Reglas del plan:
- Una tarea = un archivo o un cambio cohesivo y reversible
- Ordenar de menor a mayor dependencia (las bases primero)
- Incluir tests como tareas explícitas, no como afterthought
- No agrupar varios archivos en una tarea si pueden fallar de forma independiente

**10.** STOP — presentar el plan y preguntar: _"¿Ajustamos el plan antes de ejecutar?"_ No continuar hasta recibir confirmación.

## Fase 5 — Ejecución

**11.** Ejecutar una tarea a la vez, en orden:

Por cada tarea `[ ] Tn`:
1. Implementar el cambio
2. Commit atómico: `<tipo>(<scope>): <descripción> [<TICKET-ID>]`
3. Marcar `[x] Tn` en el plan y reportar progreso: `✓ T1/3 completada`
4. Si aparece algo no previsto (archivo diferente al esperado, dependencia oculta, comportamiento inesperado) → **STOP**, describir la desviación y esperar decisión antes de continuar

No continuar con `Tn+1` hasta que `Tn` tenga commit.

## Fase 6 — Verificación

**12.** Por cada criterio de aceptación del brief, verificar goal-backward:

```
✅ AC-1: <descripción> — implementado en T2 (path/archivo.ts:45)
⚠️ AC-2: <descripción> — parcial: falta X
❌ AC-3: <descripción> — no implementado
```

**13.** Si hay ⚠️ o ❌ → implementar lo que falta antes de reportar como completo. No declarar la tarea terminada hasta que todos los ACs sean ✅.

**14.** Reportar resumen final: N tareas completadas, N commits, todos los ACs verificados.

## Errores comunes

| Error | Corrección |
|-------|------------|
| Tomar el Figma genérico del header del FRD | Buscar la sección `### HU-XX` y extraer el node-id de ahí |
| Mezclar cambios FE y BE en el mismo brief | Filtrar estrictamente por `TASK_TYPE` desde la Spec Técnica |
| Buscar "Documento fuente" en remote links de Jira | Está en el body de la HU — parsear el texto de `description` |
| Saltear el paso 8 si el brief quedó completo | El STOP es obligatorio siempre |
| Saltear el paso 10 si el plan parece obvio | El STOP es obligatorio siempre |
| Continuar con Tn+1 antes de commitear Tn | Cada tarea debe tener commit antes de avanzar |
| Declarar completo sin pasar por verificación | La verificación goal-backward es obligatoria, no opcional |
| Subir directo a la Spec sin pasar por la HU | El link al spec vive en la HU, no en el task |

## Cuándo NO usar

- Si el brief de esta tarea ya está cargado en la sesión actual → no re-correr el discovery, retomar desde la fase correspondiente.
