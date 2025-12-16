/**
 * Cache entry with metadata
 */
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
};

/**
 * Least Recently Used (LRU) cache with TTL support
 * Prevents unbounded memory growth by evicting least-recently-used items
 * when capacity is reached
 */
export class LRUCache<K, V> {
  private readonly cache = new Map<K, CacheEntry<V>>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number
  ) {}

  /**
   * Get a value from the cache
   * Returns undefined if key is not found or has expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access metadata for LRU tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Set a value in the cache
   * Evicts LRU item if at capacity
   */
  set(key: K, value: V): void {
    // Evict if at capacity and key is new
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Evict the least recently used item
   */
  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return { size: this.cache.size, maxSize: this.maxSize, ttlMs: this.ttlMs };
  }
}
