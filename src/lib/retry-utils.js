// Retry with exponential backoff
export async function retryAsync(fn, options = {}) {
  const {
    maxAttempts = 3,
    delayMs = 500,
    backoffMultiplier = 2,
    timeout = 10000,
    onRetry = () => {},
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout')),
            timeout
          )
        ),
      ]);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        onRetry({ attempt, error, nextDelay: delay });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Resilient data fetch
export async function fetchWithRetry(url, options = {}) {
  return retryAsync(
    () => fetch(url, { ...options, signal: AbortSignal.timeout(5000) }),
    {
      maxAttempts: 3,
      delayMs: 400,
      timeout: 8000,
      ...options.retryOptions,
    }
  );
}

// Safe JSON parse
export function safeJsonParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    console.warn('[safeJsonParse] Failed to parse:', json);
    return fallback;
  }
}

// Safe localStorage
export const safeStorage = {
  getItem(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[safeStorage] Failed to set:', key, e);
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

// Debounce with cleanup
export function debounce(fn, delayMs = 300) {
  let timeoutId;
  
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };

  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

// Circuit breaker
export class CircuitBreaker {
  constructor(threshold = 5, resetTimeMs = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.resetTimeMs = resetTimeMs;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }
}