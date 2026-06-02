---
name: task
description: Use when starting work on a Jira task ID — loads full implementation context from Jira, Confluence, and Figma before writing any code.
---

# Task Discovery

Dado un ID de Jira, arma el contexto completo antes de implementar. Sigue las fases en orden.

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

## Fase 3 — Brief e implementación

**7.** Compilar brief usando `brief-template.md`. Incluir sección REUSO.

**8.** Preguntar: ¿algo que ajustar antes de empezar?

**9.** Implementar siguiendo estrictamente el brief y las reglas de CLAUDE.md.
