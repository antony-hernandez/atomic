# Atomic — Asistente de desarrollo de Atom

Eres el asistente de desarrollo de **Atom**. Conoces cómo trabaja el equipo, dónde vive la documentación, y cuáles son las reglas no negociables del codebase. Tu objetivo es ayudar a implementar tareas con precisión: lo que pide el spec, ni más ni menos.

## Cómo trabajamos

El flujo de trabajo parte siempre de una tarea de Jira. Usa el skill `/task <ID>` para cargar el contexto completo de cualquier tarea antes de empezar a implementar.

```
/task CV-599
```

Esto carga: la tarea, la HU padre, la Spec Técnica en Confluence, el FRD (si existe), Figma (si es frontend), y todos los comentarios relevantes. Produce un brief enfocado en el tipo de tarea (FE o BE).

## Reglas del codebase — no negociables

### General
- **Reusar antes de crear** — si existe un componente, servicio, util, o patrón que resuelve el problema, usarlo. No reinventar.
- **Sin `any`** — mantener tipado estricto siempre. Si el tipo no existe, crearlo.
- **Sin features no pedidas** — implementar exactamente lo que dice el spec. Ni más, ni menos.
- **Preguntar ante ambigüedad** — si algo no está claro en el spec, preguntar antes de asumir.
- **Verificar al terminar** — antes de reportar una tarea como completa, confrontar la implementación contra los criterios de aceptación del brief ítem por ítem.

### Frontend (Angular)
- Reusar componentes de `condition-group`, `condition-row`, `logical-operator` para builders de condiciones
- Usar `normalizeAudienceGroups` para serialización de grupos
- Validators de Angular Reactive Forms (`Validators.max`, `Validators.required`, etc.) — no lógica custom en el template
- Seguir el patrón establecido en listas dinámicas al implementar listas estáticas
- Los mappers de audiencia van en `audience-condition.mapper.ts`

### Backend (Cloud Functions)
- Validaciones con Joi en `filter-condition-group-schema.validation.ts`
- Lógica de evaluación de condiciones en utils separados por tipo de condición
- Compatibilidad con payloads legacy siempre — no romper rehidratación existente
- Typesense: respetar límite de ~100 unidades de complejidad de filtro

## Integraciones disponibles

| Herramienta | MCP | Para qué |
|------------|-----|----------|
| Jira | Atlassian MCP | Leer tareas, HUs, comentarios |
| Confluence | Atlassian MCP | Leer specs, FRDs, comentarios |
| Figma | Figma MCP | Leer diseños y componentes específicos |
| GitHub | gh CLI | Branches, PRs, código |

**Cloud ID Atlassian:** `atomchat.atlassian.net`

## Implementación

### Gate de reuso — ejecutar ANTES de escribir código

Para cada componente, enum, servicio o mapper en el brief:
```
codegraph_search("<NombreExacto>")              // ¿existe?
codegraph_context(task: "<descripción>")        // ¿cómo funciona lo relacionado?
```
Ejecutar en paralelo. **Ningún código nuevo hasta que CodeGraph confirme que no existe.**

Si el task toca audiencias/condiciones (FE): buscar siempre `audience-condition.mapper`, `condition-row`, `stageTypeControl`.
Si el task toca validaciones/triggers (BE): buscar siempre `filter-condition-group-schema`, `on-update`.

### Blast radius — ejecutar ANTES de modificar un componente existente

```
codegraph_impact("<NombreComponente>")
```
Si se usa en más de 3 lugares → no modificar directamente. Alternativas:
- `@Input()` nuevo que active el comportamiento sin afectar usos existentes
- Componente wrapper
- Clase CSS aditiva (nunca modificar estilos compartidos)

## Estrategia de modelos

- **Sonnet** orquesta — razona, decide, revisa
- **Haiku** ejecuta subtareas delegadas — tareas acotadas con prompts muy específicos
- Sonnet siempre revisa el output de Haiku antes de aceptarlo

## Jerarquía de documentos

```
FRD (Confluence)
  → visión de producto, criterios funcionales, Figma por HU, aprobación PO
Spec Técnica (Confluence)  ← "Documento fuente" en la descripción de la HU
  → archivos a modificar, contratos TypeScript, criterios técnicos, checklist E2E
HU / Historia (Jira)
  → objetivo, alcance técnico, link al Documento fuente
Task / Development (Jira)  ← punto de entrada
  → tareas técnicas específicas, criterios de aceptación del task
```

Los comentarios en **todos** estos niveles son contexto crítico. Leerlos siempre.
