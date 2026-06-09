---
name: spec
version: 1.0.0
description: Use when converting a Confluence FRD into a technical spec and Jira backlog — before any implementation begins.
---

# Spec — FRD a Spec Técnica

Dado un FRD en Confluence, produce los cambios técnicos correspondientes en el documento de Spec Técnica existente y (opcionalmente) el backlog de Jira. Opera como un tech lead senior que lee el FRD con escepticismo: mucha documentación de producto es generada con IA y suena completa sin serlo.

## Principio guía — leer con escepticismo, no con fe

Un FRD puede estar bien escrito y aun así tener fugas críticas. Antes de documentar cualquier cambio técnico, auditar activamente:

- **ACs genéricos** — "el usuario puede hacer X" sin condición de borde, sin estado de error, sin caso vacío
- **Validaciones sin reglas** — "validar el formulario" sin especificar qué reglas, qué mensajes, qué comportamiento
- **UI ambigua** — "mostrar mensaje / toast / modal" sin especificar contenido, duración, trigger exacto
- **Happy path only** — flujo principal documentado, error states ausentes
- **Contradicciones inter-sección** — el LLM puede haber cambiado de criterio entre secciones sin darse cuenta
- **Mobile = Web asumido** — comportamiento idéntico entre plataformas sin justificación explícita
- **Refs a Figma sin node-id** — "ver diseño" sin link específico al frame

Cuando una fuga afecta decisiones técnicas → preguntar. Cuando es cosmética y no impacta la implementación → documentarla como `⚠️ Pendiente de aclaración` en la spec y continuar.

## Pre-flight — verificar MCPs

Llamar `atlassianUserInfo()`. Si falla → **STOP** con instrucciones de setup (igual que `/task`).
Verificar que CodeGraph esté disponible con `codegraph_status()`. Si falla → continuar sin análisis de impacto y advertirlo.

## Invocación

```
/spec <URL_FRD> [<URL_DOC_BASE>]
```

- `URL_FRD` — página Confluence del FRD (requerido)
- `URL_DOC_BASE` — página Confluence de la Spec Técnica a actualizar (opcional; si no se pasa, preguntar)

## Fase 1 — Ingesta del FRD

**1.** Leer FRD completo: `getConfluencePage` + `getConfluencePageFooterComments` + `getConfluencePageInlineComments` (en paralelo). Los comentarios son contexto crítico — muchas decisiones de diseño viven ahí, no en el body.

**2.** Si se pasó `URL_DOC_BASE`: leer el documento base con el mismo patrón (página + comentarios). Identificar su estructura exacta — secciones, títulos, niveles de heading, formato de tablas. **Esta estructura no se toca.**

Si no se pasó: preguntar _"¿Cuál es la URL de la Spec Técnica a actualizar?"_ No continuar hasta tener el doc base.

**3.** Identificar las HUs del FRD. Listarlas internamente:
```
HU-01: <título>
HU-02: <título>
...
```

## Fase 2 — Auditoría del FRD

**4.** Por cada HU, auditar activamente buscando los patrones de fuga listados en el principio guía. Producir internamente:

```
HU-01:
  ✅ AC-1: específico y verificable
  ⚠️  AC-2: vago — "mostrar feedback al usuario" sin especificar qué feedback
  ❌ Error state: no documentado qué pasa si el endpoint falla
  ❌ Validación: "campo requerido" sin mensaje de error definido
```

**5.** Clasificar cada fuga:
- **Bloqueante para la spec** — sin esta info no se puede decidir qué código escribir → preguntar
- **No bloqueante** — la implementación tiene una respuesta razonable → documentar como `⚠️ Pendiente` y continuar

## Fase 3 — Análisis de impacto en codebase

**6.** Por cada HU (en paralelo donde sea posible):
```
codegraph_context(task: "<descripción de la HU>")
codegraph_impact("<componente o entidad central>")
```

Construir mapa de impacto:
```
HU-01 → afecta: [archivos], [componentes], [servicios]
         blast radius: <bajo / medio / alto>
         stacks: [FE] / [BE] / [Mobile]
```

Si blast radius alto (componente usado en más de 3 lugares) → flaggearlo explícitamente en la spec.

## Fase 4 — Clarificación

**7.** Consolidar preguntas bloqueantes de la Fase 2. Si hay más de 3, priorizar por impacto y presentarlas en una sola ronda. Formato:

```
Encontré algunos gaps en el FRD que necesito aclarar antes de documentar:

1. [HU-02] El AC dice "validar formato de teléfono" — ¿qué formato exactamente? (ej: +54 11 XXXX-XXXX, o solo dígitos, o internacional)
2. [HU-03] No está definido qué pasa si el usuario cierra el modal sin guardar — ¿descarta o pregunta confirmación?
3. [HU-01] La misma feature aplica a mobile? El FRD no lo menciona explícitamente.
```

**STOP** — esperar respuestas antes de continuar.

## Fase 5 — Draft de cambios técnicos

**8.** Por cada HU y cada stack afectado, producir documentación que sea **realmente útil para implementar** — no listas de bullet points genéricos. Estándares:

**Archivos**: rutas verificadas por CodeGraph, no inventadas. Acción exacta (create / modify / delete). Descripción específica del cambio, no "actualizar lógica".

**Contratos TypeScript**: interfaces y tipos concretos, no esqueletos. Si extiende una interfaz existente, mostrar la interfaz base con los campos nuevos marcados. Si es un enum nuevo, listar todos los valores. Si es un tipo de request/response, mostrar la estructura completa.

**ACs técnicos**: cada criterio debe ser verificable por un QA sin ambigüedad. Incluir: estado inicial → acción → resultado esperado. Incluir casos de error cuando aplique.

Formato por HU:

```markdown
### HU-01 — <título>

**Stack afectado:** Frontend / Backend / Mobile (solo los que aplican)

**Archivos a modificar**
| Archivo | Acción | Cambio |
|---------|--------|--------|
| `src/app/feature/component.ts` | modify | Agregar control `nuevoCampo` al FormGroup con `Validators.required` y `Validators.maxLength(50)` |
| `src/app/feature/component.mapper.ts` | modify | Mapear `nuevoCampo` en `toApiModel()` y `fromApiModel()` |
| `src/assets/i18n/es.json` | modify | Agregar `feature.nuevoCampo.label`, `feature.nuevoCampo.placeholder`, `feature.nuevoCampo.error.required` |
| `src/assets/i18n/en.json` | modify | Idem en inglés — misma capitalización y puntuación |

**Contratos TypeScript**
\`\`\`typescript
// Extender FeatureModel existente — no crear tipo paralelo
export interface FeatureModel {
  existingField: string;       // sin cambios
  nuevoCampo: string;          // NUEVO — requerido, max 50 chars
}

// Request al endpoint existente
export interface UpdateFeatureRequest {
  // ...campos existentes
  nuevoCampo: string;
}
\`\`\`

**Criterios de aceptación**
- [ ] El campo `nuevoCampo` aparece en el formulario con label "X" y placeholder "Y"
- [ ] Si se envía el formulario con `nuevoCampo` vacío → mensaje de error "Campo requerido" bajo el input, formulario no se envía
- [ ] Si se supera el límite de 50 caracteres → mensaje de error en tiempo real, no al submit
- [ ] El valor se persiste correctamente en el backend (verificable en Network tab: request incluye `nuevoCampo`)
- [ ] ⚠️ Comportamiento en mobile: pendiente aclaración — el FRD no especifica si aplica a la app móvil

**Riesgos**
- ⚠️ `FeatureFormComponent` tiene blast radius alto (usado en 4 lugares: A, B, C, D) — agregar el campo como `@Input() showNuevoCampo = false` para no afectar usos existentes
```

**9.** STOP — presentar el draft completo y preguntar: _"¿Algo que corregir antes de actualizar el documento?"_

## Fase 6 — Actualización del doc base en Confluence

**10.** Editar **únicamente** la sección de cambios técnicos del documento base:
- Preservar toda la estructura, headings, estilos y secciones existentes
- Insertar o reemplazar el contenido de cambios técnicos usando el formato del draft
- Si la sección no existe → crearla en el lugar correcto del documento (preguntar si hay duda)

Usar `updateConfluencePage` con el contenido completo de la página preservando todo lo demás.

**11.** Reportar: _"✅ Spec Técnica actualizada: [link]"_

## Fase 7 — Backlog Jira (opcional)

**12.** Preguntar: _"¿Creamos el backlog en Jira? (Epic → HUs → Dev tasks)"_

Si sí:
- Verificar si ya existe un Epic para este FRD (`search` en Jira)
- Si no existe → crear Epic con link al FRD y a la Spec Técnica
- Por cada HU: crear Story con ACs del draft en descripción, link a Spec Técnica
- Por cada HU: crear Dev tasks ([FRONTEND], [BACKEND], [MOBILE]) según stacks afectados
- **STOP** — presentar la jerarquía planeada antes de crear nada en Jira

**13.** Crear tickets en orden: Epic → HUs → Tasks. Reportar URLs al finalizar.

## Errores comunes

| Error | Corrección |
|-------|------------|
| Asumir que el FRD está completo porque está bien redactado | Auditar activamente — los docs con IA suenan completos sin serlo |
| Modificar el formato o estructura del doc base | Solo tocar la sección de cambios técnicos |
| Documentar cambios BE en un task que es solo FE | Filtrar por stack desde el mapa de impacto |
| Crear spec con archivos inventados | Verificar con CodeGraph que el archivo existe antes de listarlo |
| Preguntar por cada ambigüedad cosmética | Solo preguntar cuando la ambigüedad bloquea una decisión técnica real |
| Crear tickets en Jira sin STOP previo | El paso 12 es una pregunta, nunca una acción automática |
| Ignorar comentarios del FRD | Los comentarios tienen decisiones de diseño que no están en el body |

## Cuándo NO usar

- Si ya existe una Spec Técnica completa y solo necesitás implementar → usar `/task <ID>`
- Si el FRD es un stub de 2 líneas → pedir que lo completen antes de correr el skill
