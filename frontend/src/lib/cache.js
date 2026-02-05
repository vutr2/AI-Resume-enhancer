import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * In-memory cache with async filesystem persistence for cold start recovery.
 * For production with multiple instances, replace with Redis.
 */

const CACHE_DIR = path.join(os.tmpdir(), 'resumax-ai-cache');

let cacheReady = false;

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    cacheReady = true;
  } catch {
    cacheReady = false;
  }
}

// Init on module load (non-blocking)
ensureCacheDir();

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.maxSize = 100;
    this._cleanupTimer = null;
    this._startCleanup();
  }

  _startCleanup() {
    // Use unref() so the timer doesn't keep the process alive in serverless
    this._cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 600000);
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }

  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  static hashKey(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached value - checks memory first, then disk (async)
   */
  get(key) {
    const entry = this.store.get(key);
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        this._diskDelete(key);
        return null;
      }
      entry.lastAccessed = Date.now();
      return entry.value;
    }
    return null;
  }

  /**
   * Async get - checks memory then disk fallback for cold start recovery
   */
  async getAsync(key) {
    // Check memory first
    const memResult = this.get(key);
    if (memResult !== null) return memResult;

    // Memory miss - try disk
    if (!cacheReady) return null;

    const diskEntry = await this._diskRead(key);
    if (!diskEntry) return null;

    if (Date.now() > diskEntry.expiresAt) {
      this._diskDelete(key);
      return null;
    }

    // Restore to memory
    diskEntry.lastAccessed = Date.now();
    this.store.set(key, diskEntry);
    return diskEntry.value;
  }

  /**
   * Set cached value with TTL - writes to memory and disk (async, non-blocking)
   */
  set(key, value, ttlMs = 86400000) {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictOldest();
    }

    const entry = {
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    this.store.set(key, entry);

    // Persist to disk (fire-and-forget)
    if (cacheReady) {
      this._diskWrite(key, entry);
    }
  }

  delete(key) {
    this.store.delete(key);
    this._diskDelete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        this._diskDelete(key);
      }
    }

    if (cacheReady) {
      this._diskCleanup();
    }
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this._diskDelete(oldestKey);
    }
  }

  stats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      diskEnabled: cacheReady,
    };
  }

  // ---- Async filesystem persistence ----

  _diskPath(key) {
    const safeKey = key.replace(/[^a-zA-Z0-9_:-]/g, '_').slice(0, 200);
    return path.join(CACHE_DIR, `${safeKey}.json`);
  }

  async _diskWrite(key, entry) {
    try {
      await fs.writeFile(this._diskPath(key), JSON.stringify(entry), 'utf8');
    } catch {
      // Non-critical
    }
  }

  async _diskRead(key) {
    try {
      const data = await fs.readFile(this._diskPath(key), 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  _diskDelete(key) {
    fs.unlink(this._diskPath(key)).catch(() => {});
  }

  async _diskCleanup() {
    try {
      const files = await fs.readdir(CACHE_DIR);
      const now = Date.now();
      // Process in batches of 10 to avoid blocking
      for (let i = 0; i < files.length; i += 10) {
        const batch = files.slice(i, i + 10);
        await Promise.allSettled(
          batch
            .filter((f) => f.endsWith('.json'))
            .map(async (file) => {
              const filePath = path.join(CACHE_DIR, file);
              try {
                const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                if (now > data.expiresAt) {
                  await fs.unlink(filePath);
                }
              } catch {
                await fs.unlink(filePath).catch(() => {});
              }
            })
        );
      }
    } catch {
      // Non-critical
    }
  }
}

// Singleton - use global to survive HMR in dev
const globalKey = '__resumax_ai_cache__';
let aiCache;
if (process.env.NODE_ENV === 'development') {
  if (!global[globalKey]) {
    global[globalKey] = new MemoryCache();
  }
  aiCache = global[globalKey];
} else {
  aiCache = new MemoryCache();
}

/**
 * Cache wrapper for AI analysis results
 * @param {string} rawText - Resume raw text
 * @param {string} type - Type of analysis ('process', 'rewrite', 'cover-letter')
 * @param {string} extraKey - Additional key differentiator (e.g., style+tone)
 * @param {Function} fetchFn - Async function to call if cache misses
 * @returns {any} Cached or fresh result
 */
export async function cachedAICall(rawText, type, extraKey, fetchFn) {
  const cacheKey = `${type}:${MemoryCache.hashKey(rawText + (extraKey || ''))}`;

  // Check cache (memory + async disk fallback)
  const cached = await aiCache.getAsync(cacheKey);
  if (cached) {
    console.log(`AI Cache HIT: ${type}`);
    return cached;
  }

  console.log(`AI Cache MISS: ${type}`);

  const result = await fetchFn();

  // Cache for 24 hours
  aiCache.set(cacheKey, result, 86400000);

  return result;
}

export default aiCache;
