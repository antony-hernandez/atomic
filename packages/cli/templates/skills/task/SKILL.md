---
name: task
version: 3.2.0
description: Use when starting work on any Jira task — before reading code, writing code, or asking the user for context.
---

# Task Discovery

Dado un ID de Jira (task o HU), arma el contexto completo y ejecuta la implementación en fases.

## Principio guía

**El spec describe el qué desde afuera, no el cómo desde adentro.** Quien lo redactó no miraba el código — por eso no documenta todos los archivos que cambian, las dependencias que se rompen, ni dónde vive la lógica. Implementar el spec literalmente produce código que funciona en el camino feliz y sorprende en producción.

El trabajo no es transcribir el spec. Es validar que es implementable, mapear lo que no documenta, y reportar lo que no cierra antes de escribir una línea.

## Pre-flight

Llamar `atlassianUserInfo()`. Si falla → detener y mostrar:

```
❌ MCP de Atlassian no está conectado.

Para usar /task necesitás conectarlo primero:
  1. Abrí claude.ai/settings → Integrations
  2. Conectá "Atlassian" y autenticá con tu cuenta de Atom (antony.hernandez@atomchat.io)
  3. Reiniciá esta sesión de Claude Code
```

Si context7 no está disponible → continuar, pero anotar `⚠️ Context7 ausente` en el brief si el task involucra tecnologías con límites no triviales.

## Fase 1 — Discovery

**1. Task** — `getJiraIssue(cloudId: "atomchat.atlassian.net", issueIdOrKey, responseContentFormat: "markdown", fields: ["summary","description","parent","comment","issuetype"])`
- `[FRONTEND]` en summary → `TASK_TYPE = FE` / `[BACKEND]` → BE / ninguno → preguntar
- Sin criterios de aceptación → detenerse y exigirlos antes de continuar

**2. HU padre** — si `hierarchyLevel === -1`, fetch del `parent.key`. Buscar "Documento fuente" en el body: `wiki/x/<tinyId>` o `wiki/spaces/.../pages/<id>`.

**3. Spec técnica** — `getConfluencePage` + footer comments + inline comments. Extraer todos los cambios técnicos de ambos lados — guardar como `FE_CHANGES` y `BE_CHANGES`. El filtro por `TASK_TYPE` aplica solo para qué implementar, no para qué leer. Buscar link a FRD en el body.

**4. FRD** (si existe) — `getConfluencePage` + comentarios. Identificar sección `### HU-XX`. Extraer Figma node-id específico de esa sección (FE) y criterios funcionales.
- Si `TASK_TYPE = FE` y no hay Figma node-id → `⚠️ Figma ausente` en el brief.

Al leer los docs: anotar señales de spec superficial (describe resultado sin archivos ni contratos, omite casos de error) y decisiones de diseño abiertas ("pendiente de refinamiento", "a definir"). Registrar para el paso 7.

## Fase 2 — Análisis

No se puede avanzar a Fase 3 hasta completar los tres pasos de esta fase.

**5. Cross-check documental**

- **FRD vs task/HU**: comparar criterios funcionales. Mismatches → resolver antes de continuar.
- **Contratos FE↔BE**: buscar inconsistencias entre `FE_CHANGES` y `BE_CHANGES` en valores que cruzan la frontera — enum values, field names, payload keys. Si la spec contradice sus propios dos lados → **❓ Bloqueante**.

**6. Análisis del código**

Para cada entidad técnica del spec:
```
codegraph_search("<NombreExacto>")
codegraph_context(task: "<descripción del cambio>")
```

**Anti-patrón: spec-tunnel.** El spec documenta un punto de control — el más obvio para quien lo escribió. El modelo de datos del sistema tiene más. Antes de planear:
- ¿Qué activa el comportamiento? (el flag, la condición, el guard)
- ¿Qué alimenta el elemento? (la fuente de datos, el array de opciones, la configuración que define qué aparece)
- ¿En cuántos lugares necesita vivir esta lógica? Si es más de uno → verificar si existe un lugar compartido. Si no existe pero el duplicado sería exacto → proponer extracción como primera tarea del plan.

**Anti-patrón: patrón inventado.** Antes de introducir una nueva dependencia (servicio, repositorio, instancia), trazar cómo ya se usa en contextos similares (`codegraph_callers`). Mezclar estrategias de integración en el mismo codebase multiplica la inconsistencia — el próximo developer asume que son alternativas equivalentes. Seguir el patrón existente.

Si CodeGraph identifica un **registro central** — array/map/constante que centraliza configuración por tipo — leer una entrada existente y documentar su estructura como patrón a seguir. La alternativa (guard ad-hoc en el consumidor) rompe cuando el siguiente tipo no encuentra su case.

Blast radius de cada símbolo a modificar:
```
codegraph_impact("<NombreComponente>")
```
Si se usa en más de 3 lugares → proponer `@Input()` nuevo o función de extensión.

**7. Viabilidad técnica**

No se puede planear hasta que todos los ❓ Bloqueantes estén resueltos.

- **Decisiones arquitecturales abiertas**: ¿el spec deja explícitamente pendiente una decisión de diseño? → **❓ Bloqueante**. Asumir la decisión produce código que hay que tirar cuando el equipo la resuelve de otra forma.
- **Tecnología identificada**: ¿qué sistema concreto ejecuta cada operación (Typesense, Firestore, API interna)? Si no está explícito → preguntar.
- **Constraints de la tecnología**: ¿la implementación puede alcanzar límites conocidos? Si hay dudas → consultar con context7.
- **Approach viable**: ¿la solución del spec funciona dada la estructura real del código?
- **Prerequisites implícitos**: ¿hay cambios previos necesarios que el spec no menciona?

Clasificar: ❓ Bloqueante / ⚠️ Asumido.

## Fase 3 — Brief

**8. Auditar ACs** — por cada criterio de aceptación:

- ¿Solo documenta el happy path? → ¿qué pasa si falla, si el recurso no existe, si el valor es null?
- ¿Menciona validación sin definir las reglas? (¿qué mensaje? ¿qué condición exacta?)
- ¿Asume que una entidad existe sin especificar qué pasa si no?
- ¿Modifica un contrato BE sin especificar compatibilidad con clientes mobile?

Clasificar: ❓ Bloqueante / ⚠️ Asumido.

**9.** Compilar brief usando `brief-template.md`. Incluir: REUSO (de CodeGraph), GAPS (solo si los hay).

**10. STOP** — presentar el brief con bloque de alineamiento primero:

```
## Entendimiento

Objetivo: <una oración — qué problema resuelve y por qué importa>
Impacto técnico: <qué parte del sistema se toca y en qué dirección>
Fuera de scope: <qué no se va a hacer aunque esté relacionado>

¿Esto refleja lo que esperás? ¿Algo que ajustar?
```

Si hay ❓ Bloqueantes, incluirlos antes del alineamiento:

```
❓ Gaps bloqueantes — necesito respuesta antes de continuar:

1. "<cita>" — <pregunta específica>
   Por qué importa: <qué decisión técnica depende de esta respuesta>
```

No continuar hasta recibir respuesta.

## Fase 4 — Contexto git

**11.** Verificar estado:

```bash
git status && git branch --show-current
```

- Cambios sin commitear → **STOP**: _"Hay cambios sin commitear en `<rama>`. ¿Los stasheamos, commiteamos, o los manejás vos?"_
- Rama principal → **STOP**: _"Estás en `<rama>`. Para este task debería ser `<ID>/<descripción>`. ¿La creo?"_
- Rama correcta → _"Trabajando en `<rama>` ✓"_

## Fase 5 — Plan

**12.** Verificar que cada archivo del plan existe con `codegraph_search`. No incluir archivos que CodeGraph no encuentre.

```
[ ] T1: <qué cambia> — `path/archivo.ts` (modify)
        Por qué: <motivo técnico>

[ ] T2: <qué cambia> — `path/archivo.ts` (modify) ← depende de T1
        Por qué: <motivo técnico>

[ ] T3: <qué cambia> — `path/archivo.spec.ts` (create)
        Por qué: verificar que <comportamiento> funciona bajo <condición>
```

Una tarea = un archivo o cambio cohesivo y reversible. Tests como tareas explícitas, no como afterthought.

**13. STOP** — _"¿Ajustamos el plan antes de ejecutar?"_ No continuar hasta confirmación.

## Fase 6 — Ejecución

**14.** Por cada tarea `[ ] Tn`:

1. Leer el archivo objetivo — estado actual, patrones usados, dependencias visibles
2. Si lo que se ve difiere del plan → **STOP**: describir la diferencia y esperar decisión
3. Si al leer se descubre un cambio necesario que el plan no contempla → **STOP**: proponer la tarea adicional y esperar confirmación. No improvisar fuera del plan aprobado.
4. Implementar siguiendo el patrón existente más cercano
5. Commit atómico: `<tipo>(<scope>): <descripción> [<TICKET-ID>]`
6. Marcar `[x] Tn` y reportar: `✓ T1/N completada`

No avanzar a `Tn+1` hasta que `Tn` tenga commit.

## Fase 7 — Verificación

**15. Compilación** — buscar script `typecheck`, `build`, o `compile` en `package.json`. Si no existe:

```bash
npx tsc --noEmit
```

Errores de tipos → corregir antes de continuar.

**16.** Verificar goal-backward contra cada AC:

```
✅ AC-1: <descripción> — implementado en T2 (path/archivo.ts:45)
⚠️ AC-2: <descripción> — parcial: falta X
❌ AC-3: <descripción> — no implementado
```

⚠️ o ❌ → implementar lo que falta. No cerrar hasta que todos sean ✅.

## Fase 8 — Cierre

**17.** _"¿Hacemos push de `<rama>`?"_
- Sí → `git push -u origin <rama>`

**18.** _"¿Abrimos un PR?"_
- Sí → `gh pr create` con título `[<TICKET-ID>] <resumen>`, body con cambios del brief + checklist de ACs + link al ticket

## Errores comunes

| Error | Por qué importa |
|-------|-----------------|
| Tomar el Figma genérico del header del FRD | Cada HU tiene su propio node-id en su sección `### HU-XX` |
| Buscar "Documento fuente" en remote links de Jira | Está en el body de la HU, no en los links |
| Saltear el alineamiento del paso 10 | El usuario y el agente pueden tener entendimientos distintos del mismo ticket |
| Saltear el STOP del paso 13 | El plan puede tener errores que solo el usuario detecta |

## Cuándo NO usar

Si el brief ya está cargado en la sesión → retomar desde la fase correspondiente.
