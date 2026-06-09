### Frontend (Angular)
- Reusar componentes de `condition-group`, `condition-row`, `logical-operator` para builders de condiciones
- Usar `normalizeAudienceGroups` para serialización de grupos
- Validators de Angular Reactive Forms (`Validators.max`, `Validators.required`, etc.) — no lógica custom en el template
- Seguir el patrón establecido en listas dinámicas al implementar listas estáticas
- Los mappers de audiencia van en `audience-condition.mapper.ts`
- **Suscripciones**: siempre `takeUntil(this.destroy$)` + `Subject<void>` destruido en `ngOnDestroy` — sin `unsubscribe()` manual ni subscriptions huérfanas
- **@Inputs**: no mutar directamente — crear copia o emitir hacia arriba con `@Output()`
- **Change detection**: si el componente ya usa `OnPush`, mantenerlo — no bajar a `Default`
- **Tipos**: extender interfaces existentes con campos opcionales — no crear tipos paralelos para el mismo concepto
