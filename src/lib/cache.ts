import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "ai-responses.json");

interface Cache {
  [key: string]: any;
}

let memoryCache: Cache | null = null;

/**
 * Ensures the cache directory and file exist, and loads the cache into memory.
 */
async function initializeCache(): Promise<Cache> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const fileContent = await fs.readFile(CACHE_FILE, "utf-8");
    memoryCache = JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist or is invalid JSON, start with an empty cache.
    memoryCache = {};
  }
  return memoryCache!;
}

/**
 * Retrieves a value from the cache.
 * @param key The cache key.
 * @returns The cached value, or null if not found.
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  const cache = await initializeCache();
  return cache[key] ?? null;
}

/**
 * Stores a value in the cache and persists it to the file.
 * @param key The cache key.
 * @param value The value to store.
 */
export async function setInCache<T>(key: string, value: T): Promise<void> {
  const cache = await initializeCache();
  cache[key] = value;
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
}