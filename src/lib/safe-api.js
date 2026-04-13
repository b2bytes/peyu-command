import { base44 } from '@/api/base44Client';
import { retryAsync, safeJsonParse, CircuitBreaker } from '@/lib/retry-utils';

// Circuit breakers per entity
const circuitBreakers = new Map();

function getCircuitBreaker(entityName) {
  if (!circuitBreakers.has(entityName)) {
    circuitBreakers.set(entityName, new CircuitBreaker(5, 60000));
  }
  return circuitBreakers.get(entityName);
}

/**
 * Safe entity list with retry and circuit breaker
 */
export async function safeEntityList(entityName, options = {}) {
  const breaker = getCircuitBreaker(entityName);
  
  return breaker.execute(async () => {
    return retryAsync(
      () => base44.entities[entityName].list(),
      {
        maxAttempts: 3,
        delayMs: 400,
        timeout: 8000,
        ...options,
      }
    );
  }).catch((error) => {
    console.error(`[safeEntityList] ${entityName}:`, error);
    return [];
  });
}

/**
 * Safe entity filter with retry
 */
export async function safeEntityFilter(entityName, query = {}, options = {}) {
  const breaker = getCircuitBreaker(entityName);

  return breaker.execute(async () => {
    return retryAsync(
      () => base44.entities[entityName].filter(query),
      {
        maxAttempts: 3,
        delayMs: 400,
        timeout: 8000,
        ...options,
      }
    );
  }).catch((error) => {
    console.error(`[safeEntityFilter] ${entityName}:`, error);
    return [];
  });
}

/**
 * Safe entity create with validation
 */
export async function safeEntityCreate(entityName, data = {}, options = {}) {
  if (!entityName || !data || typeof data !== 'object') {
    throw new Error('Invalid entity name or data');
  }

  const breaker = getCircuitBreaker(entityName);

  return breaker.execute(async () => {
    return retryAsync(
      () => base44.entities[entityName].create(data),
      {
        maxAttempts: 2,
        delayMs: 300,
        timeout: 10000,
        ...options,
      }
    );
  }).catch((error) => {
    console.error(`[safeEntityCreate] ${entityName}:`, error);
    throw error;
  });
}

/**
 * Safe entity update with validation
 */
export async function safeEntityUpdate(entityName, id, data = {}, options = {}) {
  if (!entityName || !id || !data || typeof data !== 'object') {
    throw new Error('Invalid entity name, id, or data');
  }

  const breaker = getCircuitBreaker(entityName);

  return breaker.execute(async () => {
    return retryAsync(
      () => base44.entities[entityName].update(id, data),
      {
        maxAttempts: 2,
        delayMs: 300,
        timeout: 10000,
        ...options,
      }
    );
  }).catch((error) => {
    console.error(`[safeEntityUpdate] ${entityName}:`, error);
    throw error;
  });
}

/**
 * Safe entity delete
 */
export async function safeEntityDelete(entityName, id, options = {}) {
  if (!entityName || !id) {
    throw new Error('Invalid entity name or id');
  }

  const breaker = getCircuitBreaker(entityName);

  return breaker.execute(async () => {
    return retryAsync(
      () => base44.entities[entityName].delete(id),
      {
        maxAttempts: 2,
        delayMs: 300,
        timeout: 10000,
        ...options,
      }
    );
  }).catch((error) => {
    console.error(`[safeEntityDelete] ${entityName}:`, error);
    throw error;
  });
}

/**
 * Safe function invoke with timeout
 */
export async function safeFunctionInvoke(functionName, payload = {}, options = {}) {
  if (!functionName || typeof functionName !== 'string') {
    throw new Error('Invalid function name');
  }

  return retryAsync(
    () => base44.functions.invoke(functionName, payload),
    {
      maxAttempts: 2,
      delayMs: 500,
      timeout: 15000,
      ...options,
    }
  ).catch((error) => {
    console.error(`[safeFunctionInvoke] ${functionName}:`, error);
    throw error;
  });
}

/**
 * Reset all circuit breakers (useful for debugging)
 */
export function resetCircuitBreakers() {
  circuitBreakers.forEach((breaker) => breaker.reset());
}