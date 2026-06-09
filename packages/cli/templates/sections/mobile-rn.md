### Mobile (React Native)
- Reusar componentes del design system antes de crear nuevos
- **Estado**: preferir estado local + Context sobre librerías globales salvo que el estado sea genuinamente compartido
- **Navegación**: no navegar directamente desde componentes de UI — usar callbacks hacia arriba o hooks de navegación
- **Suscripciones y listeners**: limpiar siempre en el return de `useEffect`
- **Tipos**: no usar `any` — si la librería no exporta el tipo, extenderlo o inferirlo con `typeof`
- **Performance**: evitar funciones y objetos inline en JSX para componentes que se renderizan frecuentemente — usar `useCallback`/`useMemo` donde aplique
