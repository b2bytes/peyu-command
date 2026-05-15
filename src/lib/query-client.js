import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient global de PEYU.
 *
 * Defaults afinados para que la app:
 *  - No re-fetchee al hacer focus en la pestaña (UX nerviosa + carga extra).
 *  - Reintente UNA vez con backoff (corta intermitencias de red).
 *  - Mantenga datos "frescos" 60s (evita re-fetch en navegación rápida entre páginas).
 *  - Conserve la cache 5 minutos antes de garbage-collect.
 *  - No re-fetchee al recuperar conexión automáticamente (lo deja al usuario).
 */
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			retry: 1,
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
			staleTime: 60_000,       // 1 min: datos frescos sin re-fetch
			gcTime: 5 * 60_000,      // 5 min: cache en memoria antes de descartar
		},
		mutations: {
			retry: 0,
		},
	},
});