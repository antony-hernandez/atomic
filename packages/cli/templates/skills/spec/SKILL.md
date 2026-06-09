---
name: spec
version: 1.2.0
description: Use when converting a Confluence FRD into a technical spec and Jira backlog — before any implementation begins.
---

# Spec — FRD a Spec Técnica

Dado un FRD en Confluence, produce los cambios técnicos correspondientes en el documento de Spec Técnica existente y (opcionalmente) el backlog de Jira. Opera como un tech lead senior que lee el FRD con escepticismo: mucha documentación de producto es generada con IA y suena completa sin serlo.

## Principio guía — leer con escepticismo, no con fe

Un FRD puede estar bien redactado y aun así tener fugas críticas. Auditar activamente antes de documentar cualquier cambio técnico:

- **ACs genéricos** — "el usuario puede hacer X" sin condición de borde, sin estado de error, sin caso vacío
- **Validaciones sin reglas** — "validar el formulario" sin especificar qué reglas, qué mensajes, qué comportamiento
- **UI ambigua** — "mostrar mensaje / toast / modal" sin contenido, duración ni trigger exacto
- **Happy path only** — flujo principal documentado, error states ausentes
- **Contradicciones inter-sección** — el LLM puede haber cambiado de criterio entre secciones sin darse cuenta
- **Mobile = Web asumido** — comportamiento idéntico entre plataformas sin justificación explícita
- **Refs a Figma sin node-id** — "ver diseño" sin link específico al frame
- **Retro compat ignorada** — la HU modifica un endpoint o contrato existente sin considerar que versiones anteriores de la app mobile siguen usando el formato actual

Clasificación de fugas:
- **Bloqueante** — sin esta info no se puede decidir qué código escribir → preguntar antes de continuar
- **No bloqueante** — la implementación tiene una respuesta razonable → documentar como `⚠️ Pendiente` y seguir

Si más del 50% de los ACs de una HU son fugas bloqueantes → esa HU no está lista para spec técnica. Reportarlo: _"La HU-XX tiene demasiadas ambigüedades bloqueantes. Recomiendo refinar el FRD antes de continuar con esa historia."_ No inventar ni asumir para compensar.

## Pre-flight — verificar MCPs

Llamar `atlassianUserInfo()`. Si falla → **STOP** con instrucciones de setup (igual que `/task`).
Verificar disponibilidad de CodeGraph con `codegraph_status()`. Si falla → continuar sin análisis de impacto y advertirlo explícitamente.

## Invocación

```
/spec <URL_FRD> [<URL_DOC_BASE>]
```

- `URL_FRD` — página Confluence del FRD (requerido)
- `URL_DOC_BASE` — página Confluence de la Spec Técnica a actualizar (opcional; si no se pasa, preguntar)

## Fase 1 — Ingesta

**1.** Leer en paralelo:
- FRD: `getConfluencePage` + `getConfluencePageFooterComments` + `getConfluencePageInlineComments`
- Doc base (si se pasó): ídem

Los comentarios son contexto crítico — muchas decisiones de diseño viven ahí, no en el body principal.

Durante la lectura del FRD, extraer también:
- Links a Figma (formato `figma.com/file/...` o `figma.com/design/...`) y mapearlos por HU
- Links a prototipos o videos de referencia
- Decisiones tomadas en comentarios que no están en el body

**2.** Si no se pasó `URL_DOC_BASE` → preguntar: _"¿Cuál es la URL de la Spec Técnica a actualizar?"_ No continuar hasta tenerla.

Al leer el doc base: identificar su estructura exacta — nombres de secciones, niveles de heading, formato de tablas. **Esta estructura no se modifica.** Solo se edita la sección de cambios técnicos.

**3.** Listar internamente las HUs del FRD:
```
HU-01: <título> | Figma: <node-id o "ausente"> | Stack: FE / BE / Mobile
HU-02: <título> | Figma: <node-id o "ausente"> | Stack: FE / BE / Mobile
```

## Alineamiento — STOP obligatorio antes de continuar

**4.** Antes de cualquier análisis, presentar resumen de entendimiento:

```
## Entendimiento del FRD

**Objetivo del feature:** <una oración — qué problema de usuario/negocio resuelve>
**Alcance:** <N HUs identificadas — listarlas con título>
**Stacks afectados:** Frontend / Backend / Mobile (según lo que se lee en el FRD)
**Figma disponible:** <por HU — qué tiene y qué falta>
**Lo que NO se incluye:** <qué queda fuera del scope según el FRD>

¿Esto refleja lo que esperás de este FRD? ¿Algo que ajustar antes de continuar?
```

No continuar hasta recibir confirmación. Si el usuario corrige el entendimiento → revisar el análisis del FRD antes de continuar.

## Fase 2 — Auditoría del FRD

**5.** Por cada HU, auditar activamente los patrones de fuga del principio guía:

```
HU-01:
  ✅ AC-1: específico y verificable — "si X entonces Y"
  ⚠️  AC-2: vago — "mostrar feedback al usuario" (no bloqueante: asumir toast estándar)
  ❌ Error state: no documentado qué pasa si el endpoint falla (bloqueante)
  ❌ Validación: "campo requerido" sin mensaje de error definido (bloqueante)
  ❌ Retro compat: modifica endpoint existente sin definir si el cambio es compatible con versiones anteriores de la app mobile (bloqueante)
```

Si una HU supera el 50% de fugas bloqueantes → marcarla como `🚫 No lista para spec` y excluirla del análisis técnico.

## Fase 3 — Análisis de impacto en codebase

**6.** Por cada HU apta (en paralelo donde sea posible):
```
codegraph_context(task: "<descripción de la HU>")
codegraph_impact("<componente o entidad central>")
```

Construir mapa de impacto:
```
HU-01 → archivos: [rutas verificadas], componentes: [nombres], servicios: [nombres]
         blast radius: bajo / medio / alto
         stacks: FE / BE / Mobile
         Por qué afecta esto: <una línea de razonamiento>
```

Si blast radius alto (componente usado en más de 3 lugares) → flaggearlo con propuesta concreta de cómo aislarlo (nueva `@Input()`, wrapper, etc.).

## Fase 4 — Clarificación

**7.** Consolidar fugas bloqueantes de la Fase 2. Máximo 3 preguntas por ronda, priorizadas por impacto:

```
Encontré gaps en el FRD que bloquean decisiones técnicas:

1. [HU-02] "Validar formato de teléfono" — ¿qué formato? (+54 11, solo dígitos, internacional E.164)
   Por qué importa: define si el validator es regex simple o librería de parsing
2. [HU-03] Si el usuario cierra el modal sin guardar — ¿descarta silenciosamente o pide confirmación?
   Por qué importa: determina si hay un segundo modal de confirmación o no
3. [HU-01] ¿La feature aplica a mobile? El FRD no lo menciona.
   Por qué importa: si aplica, la spec necesita una sección adicional para React Native
```

**STOP** — esperar respuestas antes de continuar.

## Fase 5 — Draft de cambios técnicos

**8.** Por cada HU apta, producir documentación que sea **realmente útil para implementar** — no bullets genéricos.

Estándares de calidad:
- **Archivos**: rutas verificadas por CodeGraph. Acción exacta (create / modify / delete). Descripción específica — no "actualizar lógica" sino "agregar control `x` al FormGroup con `Validators.required`".
- **Por qué**: cada archivo modificado debe tener una línea que explique el motivo técnico del cambio.
- **Contratos TypeScript**: interfaces completas con campos existentes + nuevos marcados. No esqueletos.
- **ACs técnicos**: verificables por QA. Formato: estado inicial → acción → resultado esperado. Incluir casos de error.

Formato por HU:

```markdown
### HU-01 — <título>

**Objetivo técnico:** <por qué existe este cambio desde la perspectiva del sistema>
**Stack afectado:** Frontend / Backend / Mobile (solo los que aplican)
**Figma:** <node-id con link, o "⚠️ ausente — confirmar con diseño">

**Archivos a modificar**
| Archivo | Acción | Cambio | Por qué |
|---------|--------|--------|---------|
| `src/app/feature/component.ts` | modify | Agregar control `nuevoCampo` al FormGroup con `Validators.required` y `Validators.maxLength(50)` | El FRD define este campo como obligatorio con límite de caracteres |
| `src/app/feature/component.mapper.ts` | modify | Mapear `nuevoCampo` en `toApiModel()` y `fromApiModel()` | El campo debe serializarse antes de enviarse al endpoint y deserializarse al leer |
| `src/assets/i18n/es.json` | modify | Agregar `feature.nuevoCampo.label`, `.placeholder`, `.error.required` | Los textos de UI van en i18n — nunca hardcodeados en template |
| `src/assets/i18n/en.json` | modify | Ídem en inglés — misma capitalización y puntuación | Consistencia entre locales obligatoria |

**Contratos TypeScript**
```typescript
// Extender FeatureModel existente — no crear tipo paralelo
export interface FeatureModel {
  existingField: string;       // sin cambios
  nuevoCampo: string;          // NUEVO — requerido, max 50 chars
}

// Request al endpoint existente — agregar campo
export interface UpdateFeatureRequest {
  // ...campos existentes sin cambios
  nuevoCampo: string;
}
```

**Criterios de aceptación**
- [ ] El campo `nuevoCampo` aparece con label "X" y placeholder "Y" (texto exacto de Figma)
- [ ] Formulario enviado con campo vacío → mensaje "Campo requerido" bajo el input, submit bloqueado
- [ ] Al superar 50 caracteres → mensaje de error en tiempo real (no al submit)
- [ ] Request al guardar incluye `nuevoCampo` en el payload (verificable en Network)
- [ ] ⚠️ Comportamiento en mobile: pendiente — FRD no especifica

**Riesgos**
- ⚠️ `FeatureFormComponent` blast radius alto (usado en A, B, C, D) — agregar como `@Input() showNuevoCampo = false` para no romper usos existentes
```

**9.** STOP — presentar el draft y preguntar: _"¿Algo que corregir antes de actualizar el documento?"_

## Fase 6 — Actualización del doc base en Confluence

**10.** Proceso para editar sin romper el documento:

1. Leer el contenido actual completo de la Spec Técnica (`getConfluencePage`)
2. Identificar la sección de cambios técnicos por su heading exacto
3. Reemplazar **solo el contenido de esa sección** — mantener todo lo demás intacto: heading, secciones adyacentes, metadata, estilos
4. Si la sección no existe → pregunta antes de crearla: _"No encontré una sección de cambios técnicos en el doc. ¿La agrego bajo el heading '<título>'?"_
5. Llamar `updateConfluencePage` con el cuerpo completo de la página modificada (no solo el fragmento)

**11.** Reportar: _"✅ Spec Técnica actualizada: [link]"_

## Fase 7 — Backlog Jira (opcional)

**12.** Preguntar: _"¿Creamos el backlog en Jira? (Epic → HUs → Dev tasks)"_

Si sí:
- Verificar si ya existe un Epic para este FRD (`searchJiraIssues`)
- **STOP** — presentar la jerarquía planeada antes de crear nada:
  ```
  Epic: <título del feature>
  ├── HU-01 [Story]: <título>
  │     └── [FRONTEND] <título task>
  │     └── [BACKEND] <título task>
  └── HU-02 [Story]: <título>
        └── [FRONTEND] <título task>
  ```
  _"¿Creamos estos tickets?"_

**13.** Crear en orden: Epic → HUs → Tasks. En cada ticket incluir:
- Descripción con objetivo técnico de la HU
- Link a la Spec Técnica actualizada
- ACs del draft como checklist

Reportar URLs al finalizar.

## Errores comunes

| Error | Corrección |
|-------|------------|
| Asumir que el FRD está completo porque suena profesional | Auditar activamente — los docs con IA suenan completos sin serlo |
| Saltear el bloque de alineamiento del paso 4 | Es obligatorio — confirmar entendimiento antes de hacer análisis costoso |
| Modificar el formato o estructura del doc base | Leer el cuerpo completo, reemplazar solo la sección de cambios técnicos, resubmitir todo |
| Documentar cambios de un stack que no aplica | Filtrar por stack desde el mapa de impacto de la HU |
| Listar archivos sin verificar que existen | Verificar con CodeGraph antes de incluir en la spec |
| Preguntar por ambigüedades cosméticas | Solo preguntar cuando la ambigüedad bloquea una decisión técnica concreta |
| Crear tickets en Jira sin STOP previo | El paso 12 es una pregunta, nunca acción automática |
| Ignorar comentarios del FRD | Las decisiones de diseño viven en los comentarios tanto como en el body |
| Continuar con una HU que supera 50% de fugas bloqueantes | Marcarla como no lista y recomendarle al usuario refinarla |
| Omitir el "Por qué" en la tabla de archivos | Cada cambio técnico debe tener su razonamiento visible |

## Cuándo NO usar

- Si ya existe una Spec Técnica completa y solo necesitás implementar → usar `/task <ID>`
- Si el FRD tiene menos de 2 HUs concretas → probablemente es un stub, pedirle al usuario que lo complete primero
