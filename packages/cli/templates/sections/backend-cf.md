### Backend (Cloud Functions)
- Validaciones con Joi en `filter-condition-group-schema.validation.ts`
- Lógica de evaluación de condiciones en utils separados por tipo de condición
- Compatibilidad con payloads legacy siempre — no romper rehidratación existente
- Typesense: respetar límite de ~100 unidades de complejidad de filtro
- **Funciones**: una responsabilidad por función — no acumular lógica en el handler principal
- **Errores**: lanzar errores tipados, nunca retornar `null` silencioso ante fallo
- **Tipos**: compartir contratos TypeScript con el frontend via tipos en el body del request/response — no duplicar definiciones
