---
name: task
version: 1.6.0
description: Use when starting work on any Jira task — before reading code, writing code, or asking the user for context.
---

# Task Discovery

Dado un ID de Jira (task o HU), arma el contexto completo y ejecuta la implementación en fases. Sigue las fases en orden. No leer código ni preguntar al usuario hasta terminar el discovery.

## Principio guía — actuar como senior, no como ejecutor

No implementar por implementar. En cada fase:

- **Si algo en el spec parece incompleto, contradictorio o riesgoso** → reportarlo antes de continuar, no asumir la interpretación más conveniente
- **Si CodeGraph revela un blast radius alto** → proponer la alternativa menos invasiva, no solo ejecutar el cambio más directo
- **Si el plan tiene una forma mejor** → sugerirla con justificación breve antes del STOP del paso 11
- **Si durante la ejecución algo no cuadra** → STOP inmediato con descripción clara del problema

El objetivo es entregar lo que el spec pide, pero con el juicio de alguien que conoce el codebase y ha visto las consecuencias de las decisiones técnicas.

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
- Si `TASK_TYPE = FE` y no se encontró ningún Figma node-id → registrar como `⚠️ Figma ausente` en el brief. No bloqueante pero debe quedar visible.

## Fase 2 — Análisis

**5. Cross-check** — comparar criterios del FRD vs task/HU. Si hay mismatches → presentar al usuario y resolver antes de continuar. Si no → silencioso.

**6. Gate de reuso** — para cada entidad técnica mencionada en el spec (componentes, servicios, mappers, tipos), ejecutar en paralelo:
```
codegraph_search("<NombreExacto>")
codegraph_context(task: "<descripción del cambio>")
```
Ningún código nuevo hasta que CodeGraph confirme que no existe. Resultados van en la sección REUSO del brief.

## Fase 3 — Brief

**7.** Compilar brief usando `brief-template.md`. Incluir sección REUSO.

**8.** STOP — presentar el brief comenzando con un **bloque de alineamiento**:

```
## Entendimiento

Objetivo del task: <una oración que resuma qué problema resuelve este cambio y por qué importa>
Impacto técnico: <qué parte del sistema se toca y en qué dirección>
Fuera de scope: <qué no se va a hacer aunque esté relacionado>

¿Esto refleja lo que esperás de esta tarea? ¿Algo que ajustar antes de empezar?
```

No continuar hasta recibir respuesta. Si el usuario corrige el entendimiento → revisar el brief antes de continuar.

## Fase 4 — Contexto git

**9.** Verificar estado del repositorio antes de tocar código:

```bash
git status              # hay cambios sin commitear?
git branch --show-current   # en qué rama estamos?
```

- Si hay cambios sin commitear → **STOP**: _"Hay cambios sin commitear en `<rama>`. ¿Los stasheamos, los commiteamos o preferís manejarlos vos antes de continuar?"_
- Si la rama actual es `main`, `master` o `develop` → **STOP**: _"Estás en `<rama>`. Para este task la rama debería ser `<ID>/<descripción-corta>`. ¿La creo y hago checkout?"_
- Si la rama ya corresponde al task → confirmar en voz alta: _"Trabajando en rama `<rama>` ✓"_ y continuar.

Nombre de rama sugerido: `<TICKET-ID>/<descripción-corta-kebab-case>` (ej: `CV-641/last-group-static-variable`). Esperar confirmación del usuario si se va a crear una nueva.

## Fase 5 — Plan de implementación

**10.** Verificar rutas del plan con CodeGraph antes de presentarlo:
```
codegraph_search("<NombreArchivo>")   // confirmar que el archivo existe
```
No incluir un archivo en el plan si CodeGraph no lo encuentra — preguntar al usuario antes.

Generar lista de tareas atómicas ordenadas por dependencia. Formato exacto:

```
[ ] T1: <qué cambia> — `path/al/archivo.ts` (modify)
        Por qué: <una línea explicando el motivo técnico de este cambio>

[ ] T2: <qué cambia> — `path/al/archivo.ts` (modify) ← depende de T1
        Por qué: <una línea>

[ ] T3: <qué cambia> — `path/al/archivo.spec.ts` (create)
        Por qué: verificar que <comportamiento esperado> funciona bajo <condición>
```

Reglas del plan:
- Una tarea = un archivo o un cambio cohesivo y reversible
- Ordenar de menor a mayor dependencia (las bases primero)
- Incluir tests como tareas explícitas, no como afterthought
- No agrupar varios archivos en una tarea si pueden fallar de forma independiente

**11.** STOP — presentar el plan y preguntar: _"¿Ajustamos el plan antes de ejecutar?"_ No continuar hasta recibir confirmación.

## Fase 6 — Ejecución

**12.** Ejecutar una tarea a la vez, en orden:

Por cada tarea `[ ] Tn`:
1. **Leer el archivo objetivo** antes de tocar nada — entender el estado actual, los patrones usados, las dependencias visibles
2. Si lo que se ve difiere de lo que el plan asumía → **STOP** antes de escribir una sola línea: describir la diferencia y esperar decisión
3. Si la tarea modifica un endpoint, request o response de BE existente → verificar retro compatibilidad: ¿el cambio rompe clientes actuales (app mobile en producción)? Si es un campo nuevo, debe ser opcional con fallback. Si renombra o elimina, es un breaking change — **STOP** y proponer estrategia de versionado antes de continuar
4. Implementar el cambio
4. Commit atómico: `<tipo>(<scope>): <descripción> [<TICKET-ID>]`
5. Marcar `[x] Tn` en el plan y reportar progreso: `✓ T1/3 completada`

No continuar con `Tn+1` hasta que `Tn` tenga commit.

## Fase 7 — Verificación

**13.** Por cada criterio de aceptación del brief, verificar goal-backward:

```
✅ AC-1: <descripción> — implementado en T2 (path/archivo.ts:45)
⚠️ AC-2: <descripción> — parcial: falta X
❌ AC-3: <descripción> — no implementado
```

**14.** Si hay ⚠️ o ❌ → implementar lo que falta antes de continuar. No pasar al cierre hasta que todos los ACs sean ✅.

## Fase 8 — Cierre

**15.** Todos los ACs ✅. Preguntar: _"¿Hacemos push de la rama `<rama>`?"_
- Si sí → `git push -u origin <rama>` (o `git push` si ya tiene upstream)
- Reportar URL del branch en GitHub

**16.** Preguntar: _"¿Abrimos un PR?"_
- Si sí → crear con `gh pr create`:
  - **Título**: `[<TICKET-ID>] <resumen del brief en una línea>`
  - **Body**: descripción de cambios del brief + checklist de ACs + link al ticket de Jira
- Reportar URL del PR al usuario

## Errores comunes

| Error | Corrección |
|-------|------------|
| Tomar el Figma genérico del header del FRD | Buscar la sección `### HU-XX` y extraer el node-id de ahí |
| Mezclar cambios FE y BE en el mismo brief | Filtrar estrictamente por `TASK_TYPE` desde la Spec Técnica |
| Buscar "Documento fuente" en remote links de Jira | Está en el body de la HU — parsear el texto de `description` |
| Saltear el paso 8 si el brief quedó completo | El STOP es obligatorio siempre — el bloque de alineamiento también |
| Saltear el paso 11 si el plan parece obvio | El STOP es obligatorio siempre |
| Incluir archivos en el plan sin verificarlos con CodeGraph | Verificar rutas antes de presentar el plan |
| Empezar a codear sin verificar la rama (paso 9) | Verificar git status y rama antes de cualquier cambio |
| Continuar con Tn+1 antes de commitear Tn | Cada tarea debe tener commit antes de avanzar |
| Declarar completo sin pasar por verificación | La verificación goal-backward es obligatoria |
| Crear PR sin esperar confirmación del usuario | Los pasos 15 y 16 son preguntas, no acciones automáticas |
| Subir directo a la Spec sin pasar por la HU | El link al spec vive en la HU, no en el task |
| Implementar sin cuestionar un spec incompleto | Si falta información crítica → preguntar, no asumir |
| Seguir el plan aunque CodeGraph revele blast radius alto | Proponer alternativa menos invasiva antes de ejecutar |
| Reportar como completo sin haber probado el flujo real | La verificación goal-backward es contra el comportamiento, no contra el código |

## Cuándo NO usar

- Si el brief de esta tarea ya está cargado en la sesión actual → no re-correr el discovery, retomar desde la fase correspondiente.
