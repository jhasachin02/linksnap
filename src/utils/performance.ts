import React from 'react';

/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * End timing an operation and calculate duration
   */
  end(name: string): number | undefined {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No performance metric found for: ${name}`);
      return undefined;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration,
    });

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to measure async function performance
 */
export function measureAsync<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    performanceMonitor.start(name);
    try {
      const result = await fn(...args);
      return result;
    } finally {
      performanceMonitor.end(name);
    }
  }) as T;
}

/**
 * Debounce utility for search and input handling
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Cache with TTL (Time To Live) for API responses
 */
export class TTLCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  private readonly ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttlMs;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + this.ttl,
    });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    
    return this.cache.size;
  }
}

/**
 * Lazy loading utility for components
 */
export function createLazyComponent(
  loader: () => Promise<{ default: React.ComponentType<any> }>
) {
  return React.lazy(loader);
}

/**
 * Simple request deduplication
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();
