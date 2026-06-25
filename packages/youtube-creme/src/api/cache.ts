import { Logger } from '../utils/logger';
import { loadSettings } from '../config/settings';

export const SCRIPT_PREFIX = "yte";
const DB_NAME = `${SCRIPT_PREFIX}_database`;
const STORE_NAME = "api_cache";
const DB_VERSION = 1;

export interface LikesData {
  likes: number;
  dislikes: number;
}

interface CacheEntry {
  videoId: string;
  data: LikesData;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "videoId" });
      }
    };
    
    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event: Event) => {
      Logger.error("[Cache] Failed to open IndexedDB", event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
  
  return dbPromise;
}

export async function getCachedVideoData(videoId: string): Promise<LikesData | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(videoId);
      
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        
        const settings = loadSettings();
        // default to 24 hours if not set
        const durationHours = settings.cacheDurationHours ?? 24; 
        const maxAgeMs = durationHours * 60 * 60 * 1000;
        
        if (Date.now() - entry.timestamp > maxAgeMs) {
          // Expired
          const deleteTx = db.transaction(STORE_NAME, "readwrite");
          deleteTx.objectStore(STORE_NAME).delete(videoId);
          resolve(null);
        } else {
          resolve(entry.data);
        }
      };
      
      request.onerror = () => {
        Logger.error(`[Cache] Failed to read ${videoId} from IndexedDB`, request.error);
        resolve(null); 
      };
    });
  } catch (err) {
    Logger.error("[Cache] IndexedDB error", err);
    return null;
  }
}

export async function setCachedVideoData(videoId: string, videoData: LikesData): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const entry: CacheEntry = {
        videoId,
        data: videoData,
        timestamp: Date.now()
      };
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
        Logger.error(`[Cache] Failed to write ${videoId} to IndexedDB`, request.error);
        resolve(); 
      };
    });
  } catch (err) {
    Logger.error("[Cache] IndexedDB error", err);
  }
}
