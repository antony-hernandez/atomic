---
name: task
version: 2.0.0
description: Use when starting work on any Jira task — before reading code, writing code, or asking the user for context.
---

# Task Discovery

Dado un ID de Jira (task o HU), arma el contexto completo y ejecuta la implementación en fases. Seguir las fases en orden. No leer código ni preguntar al usuario hasta terminar el discovery.

## Principio guía

El spec es el punto de partida, no la verdad. Quien lo escribió probablemente no conocía todas las implicaciones técnicas.

- Si algo no cierra técnicamente → reportarlo antes de continuar
- Si CodeGraph revela más complejidad de la que el spec documenta → surfacear antes de ejecutar
- Si durante la ejecución algo difiere de lo que el plan asumía → STOP inmediato

## Pre-flight

Llamar `atlassianUserInfo()`. Si falla o no está disponible → detener y mostrar:

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

Si context7 no está disponible → continuar, pero en el paso 7 (Viabilidad técnica) no habrá forma de verificar constraints de librerías contra documentación oficial. Anotarlo como `⚠️ Context7 ausente` en el brief si el task involucra tecnologías con límites no triviales.

## Fase 1 — Discovery

Ejecutar en paralelo donde sea posible.

**1. Task** — `getJiraIssue(cloudId: "atomchat.atlassian.net", issueIdOrKey, responseContentFormat: "markdown", fields: ["summary","description","parent","comment","issuetype"])`
- `[FRONTEND]` en summary → `TASK_TYPE = FE` / `[BACKEND]` → BE / ninguno → preguntar
- Sin criterios de aceptación → detenerse y exigirlos antes de continuar

**2. HU padre** — si `hierarchyLevel === -1`, fetch del `parent.key`. Buscar "Documento fuente" en el body: `wiki/x/<tinyId>` o `wiki/spaces/.../pages/<id>`.

**3. Spec técnica** — `getConfluencePage` + footer comments + inline comments (en paralelo). Extraer cambios técnicos y criterios filtrados por `TASK_TYPE`. Buscar link a FRD en el body.

**4. FRD** (si existe) — `getConfluencePage` + comentarios. Identificar sección `### HU-XX` correspondiente. Extraer Figma node-id específico de esa sección (FE) y criterios funcionales.
- Si `TASK_TYPE = FE` y no se encontró Figma node-id → registrar como `⚠️ Figma ausente`. No bloqueante pero debe quedar visible en el brief.

Al leer los docs, anotar señales de spec superficial: solo describe el resultado sin archivos ni contratos, asume que los cambios son simples sin analizar dependencias, omite casos de error. No bloquear aquí — registrar para el paso 7.

## Fase 2 — Análisis

**5. Cross-check** — comparar criterios del FRD vs task/HU. Si hay mismatches → presentar al usuario y resolver antes de continuar. Si no → silencioso.

**6. Gate de reuso** — para cada entidad técnica mencionada en el spec (componentes, servicios, mappers, tipos), ejecutar en paralelo:
```
codegraph_search("<NombreExacto>")
codegraph_context(task: "<descripción del cambio>")
```
Ningún código nuevo hasta que CodeGraph confirme que no existe. Resultados van en la sección REUSO del brief.

**7. Viabilidad técnica** — con el contexto de CodeGraph disponible, evaluar:

- **Scope real vs documentado**: ¿CodeGraph revela blast radius o dependencias que el spec no menciona? ¿Hay archivos que claramente necesitan cambiar pero no están en el spec?
- **Tecnología identificada**: ¿qué sistema concreto resuelve cada operación del task (Typesense, Firestore, API interna, etc.)? Si no está explícito → preguntar. No asumir.
- **Constraints de la tecnología**: ¿la implementación propuesta puede alcanzar límites conocidos? (complejidad de query, rate limits, tamaño de payload, cuotas, versiones de API). Si hay dudas sobre el comportamiento o los límites reales → consultar la documentación oficial con context7 antes de asumir.
- **Approach viable**: ¿la solución que propone el spec es correcta dada la estructura real del código? ¿o requiere un approach distinto al implementarla?
- **Prerequisites implícitos**: ¿hay cambios previos necesarios que el spec no menciona? (migraciones, contratos nuevos, cambios en otros servicios)

Clasificar cada hallazgo: ❓ Bloqueante / ⚠️ Asumido.

## Fase 3 — Brief

**8. Auditar ACs** — por cada criterio de aceptación del task:

- ¿Solo documenta el happy path? → ¿qué pasa si falla, si el recurso no existe, si el valor es null/vacío?
- ¿Menciona validación sin definir las reglas? (¿qué mensaje? ¿qué condición exacta?)
- ¿Asume que una entidad existe sin especificar qué pasa si no? (grupos, usuarios, registros referenciados)
- ¿Modifica un contrato BE existente sin especificar compatibilidad con clientes mobile actuales?

Clasificar igual: ❓ Bloqueante / ⚠️ Asumido.

**9.** Compilar brief usando `brief-template.md`. Incluir secciones: REUSO (de CodeGraph), GAPS (de pasos 7 y 8, solo si los hay).

**10. STOP** — presentar el brief comenzando con un bloque de alineamiento:

```
## Entendimiento

Objetivo: <una oración — qué problema resuelve este cambio y por qué importa>
Impacto técnico: <qué parte del sistema se toca y en qué dirección>
Fuera de scope: <qué no se va a hacer aunque esté relacionado>

¿Esto refleja lo que esperás de esta tarea? ¿Algo que ajustar antes de empezar?
```

Si hay gaps **bloqueantes** (pasos 7 u 8), incluirlos antes del alineamiento:

```
❓ Gaps bloqueantes — necesito respuesta antes de continuar:

1. "<cita del AC o aspecto técnico>" — <pregunta específica>
   Por qué importa: <qué decisión técnica depende de esta respuesta>
```

No continuar hasta recibir respuesta. Si el usuario corrige el entendimiento → revisar el brief antes de continuar.

## Fase 4 — Contexto git

**11.** Verificar estado del repositorio:

```bash
git status
git branch --show-current
```

- Cambios sin commitear → **STOP**: _"Hay cambios sin commitear en `<rama>`. ¿Los stasheamos, los commiteamos o los manejás vos?"_
- Rama principal (`main`, `master`, `develop`) → **STOP**: _"Estás en `<rama>`. Para este task la rama debería ser `<ID>/<descripción-corta>`. ¿La creo?"_
- Rama ya correcta → confirmar: _"Trabajando en `<rama>` ✓"_

Nombre sugerido: `<TICKET-ID>/<descripción-corta-kebab-case>`. Esperar confirmación si se va a crear.

## Fase 5 — Plan

**12.** Verificar que cada archivo del plan existe:
```
codegraph_search("<NombreArchivo>")
```
No incluir un archivo si CodeGraph no lo encuentra — preguntar al usuario antes.

Generar tareas atómicas ordenadas por dependencia:

```
[ ] T1: <qué cambia> — `path/archivo.ts` (modify)
        Por qué: <motivo técnico>

[ ] T2: <qué cambia> — `path/archivo.ts` (modify) ← depende de T1
        Por qué: <motivo técnico>

[ ] T3: <qué cambia> — `path/archivo.spec.ts` (create)
        Por qué: verificar que <comportamiento> funciona bajo <condición>
```

Reglas:
- Una tarea = un archivo o cambio cohesivo y reversible
- Dependencias primero
- Tests como tareas explícitas, no como afterthought
- No agrupar si los cambios pueden fallar de forma independiente

**13. STOP** — _"¿Ajustamos el plan antes de ejecutar?"_ No continuar hasta confirmación.

## Fase 6 — Ejecución

**14.** Por cada tarea `[ ] Tn`:

1. Leer el archivo objetivo — entender estado actual, patrones usados, dependencias visibles
2. Si lo que se ve difiere del plan → **STOP**: describir la diferencia y esperar decisión
3. Implementar el cambio
4. Commit atómico: `<tipo>(<scope>): <descripción> [<TICKET-ID>]`
5. Marcar `[x] Tn` y reportar: `✓ T1/N completada`

No avanzar a `Tn+1` hasta que `Tn` tenga commit.

## Fase 7 — Verificación

**15. Compilación** — antes de verificar los ACs, confirmar que el proyecto compila sin errores:

Buscar en `package.json` un script de `typecheck`, `build`, o `compile`. Si existe, usarlo. Si no:

```bash
npx tsc --noEmit    # TypeScript
```

Si hay errores de compilación o de tipos → corregirlos antes de continuar. No reportar la tarea como completa con errores de compilación pendientes.

**16.** Verificar goal-backward contra cada AC del brief:

```
✅ AC-1: <descripción> — implementado en T2 (path/archivo.ts:45)
⚠️ AC-2: <descripción> — parcial: falta X
❌ AC-3: <descripción> — no implementado
```

Si hay ⚠️ o ❌ → implementar lo que falta antes de continuar. No pasar al cierre hasta que todos sean ✅.

## Fase 8 — Cierre

**17.** Todos los ACs ✅ y compilación ✓. Preguntar: _"¿Hacemos push de `<rama>`?"_
- Si sí → `git push -u origin <rama>` (o `git push` si ya tiene upstream)
- Reportar URL del branch

**18.** Preguntar: _"¿Abrimos un PR?"_
- Si sí → `gh pr create`:
  - **Título**: `[<TICKET-ID>] <resumen en una línea>`
  - **Body**: descripción de cambios del brief + checklist de ACs + link al ticket de Jira
- Reportar URL del PR

## Errores comunes

| Error | Corrección |
|-------|------------|
| Tomar el Figma genérico del header del FRD | Buscar la sección `### HU-XX` y extraer el node-id de ahí |
| Buscar "Documento fuente" en remote links de Jira | Está en el body de la HU — parsear el texto de `description` |
| Saltear el STOP del paso 10 | Obligatorio siempre — el alineamiento también |
| Saltear el STOP del paso 13 | Obligatorio siempre |
| Incluir archivos en el plan sin verificar con CodeGraph | Verificar antes de presentar el plan |
| Reportar tarea completa sin compilar | Compilación es obligatoria antes de verificar ACs |

## Cuándo NO usar

Si el brief de esta tarea ya está cargado en la sesión → no re-correr el discovery, retomar desde la fase correspondiente.
