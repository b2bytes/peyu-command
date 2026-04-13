import { useQuery, useQueryClient } from '@tanstack/react-query';
import { retryAsync } from '@/lib/retry-utils';

/**
 * Safe wrapper around useQuery with automatic retries
 */
export function useSafeQuery(queryKey, queryFn, options = {}) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await retryAsync(() => queryFn(), {
          maxAttempts: 3,
          delayMs: 400,
          timeout: 8000,
          ...options.retryOptions,
        });
      } catch (error) {
        console.error(`[useSafeQuery] Error for ${queryKey?.[0]}:`, error);
        // Fallback to cached data if available
        const cached = queryClient.getQueryData(queryKey);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Retry once before showing error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    gcTime: 1000 * 60 * 10, // 10 minutes
    networkMode: 'online',
    ...options,
  });
}