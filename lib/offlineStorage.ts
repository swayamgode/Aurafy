import { Track } from "@/types/music";

const DB_NAME = "aurafy_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "tracks";

export interface StoredOfflineTrack {
  youtubeId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration?: number;
  album?: string;
  audioBlob: Blob;
  downloadedAt: number;
  sizeBytes: number;
}

// In-memory object URL cache for instant playback
const urlCache = new Map<string, string>();

// Open or initialize the IndexedDB instance
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "youtubeId" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Save track and its audio blob into offline storage
 */
export async function saveTrackOffline(track: Track, audioBlob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record: StoredOfflineTrack = {
      youtubeId: track.youtubeId,
      title: track.title,
      artist: track.artist,
      thumbnailUrl: track.thumbnailUrl,
      duration: track.duration,
      album: track.album,
      audioBlob,
      downloadedAt: Date.now(),
      sizeBytes: audioBlob.size,
    };

    const request = store.put(record);

    request.onsuccess = () => {
      // Update in-memory cache
      try {
        const objectUrl = URL.createObjectURL(audioBlob);
        urlCache.set(track.youtubeId, objectUrl);
      } catch {}
      resolve();
    };
    request.onerror = () => reject(request.error || new Error("Failed to save track"));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Check if a track is saved offline
 */
export async function isTrackOffline(youtubeId: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.indexedDB) return false;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(youtubeId);

      request.onsuccess = () => {
        resolve(!!request.result);
      };
      request.onerror = () => {
        resolve(false);
      };
      tx.oncomplete = () => db.close();
    });
  } catch {
    return false;
  }
}

/**
 * Read a single record from IndexedDB
 */
function readRecord(youtubeId: string): Promise<StoredOfflineTrack | null> {
  return new Promise(async (resolve) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(youtubeId);
      request.onsuccess = () => {
        resolve((request.result as StoredOfflineTrack) || null);
      };
      request.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    } catch {
      resolve(null);
    }
  });
}

/**
 * Get offline audio blob and generate object URL for playback.
 * Instant resolution with memory cache.
 */
export async function getOfflineTrack(
  youtubeId: string
): Promise<{ track: Track; blob: Blob; objectUrl: string } | null> {
  if (typeof window === "undefined" || !window.indexedDB) return null;

  try {
    const record = await readRecord(youtubeId);
    if (!record || !record.audioBlob) return null;

    let objectUrl = urlCache.get(youtubeId);
    if (!objectUrl) {
      objectUrl = URL.createObjectURL(record.audioBlob);
      urlCache.set(youtubeId, objectUrl);
    }

    return {
      track: {
        youtubeId: record.youtubeId,
        title: record.title,
        artist: record.artist,
        thumbnailUrl: record.thumbnailUrl,
        duration: record.duration || 210,
        album: record.album,
        audioUrl: objectUrl,
      },
      blob: record.audioBlob,
      objectUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve all downloaded tracks (metadata only, no blob URLs)
 */
export async function getAllOfflineTracks(): Promise<Track[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result || []) as StoredOfflineTrack[];
        const tracks: Track[] = records.map((r) => ({
          youtubeId: r.youtubeId,
          title: r.title,
          artist: r.artist,
          thumbnailUrl: r.thumbnailUrl,
          duration: r.duration || 210,
          album: r.album,
        }));
        resolve(tracks);
      };

      request.onerror = () => resolve([]);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

/**
 * Remove a track from offline storage
 */
export async function removeOfflineTrack(youtubeId: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.indexedDB) return false;
  try {
    urlCache.delete(youtubeId);
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(youtubeId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return false;
  }
}

/**
 * Calculate total offline storage usage
 */
export async function getOfflineStorageUsage(): Promise<{ count: number; sizeMB: number }> {
  if (typeof window === "undefined" || !window.indexedDB) return { count: 0, sizeMB: 0 };
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result || []) as StoredOfflineTrack[];
        const totalBytes = records.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
        const sizeMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
        resolve({ count: records.length, sizeMB });
      };

      request.onerror = () => resolve({ count: 0, sizeMB: 0 });
      tx.oncomplete = () => db.close();
    });
  } catch {
    return { count: 0, sizeMB: 0 };
  }
}
