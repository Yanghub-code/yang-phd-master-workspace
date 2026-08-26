export type LocalFolderHandle = {
  name: string;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{
    getFile: () => Promise<File>;
    createWritable: () => Promise<{
      write: (contents: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
  queryPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: "read" | "readwrite";
    }) => Promise<LocalFolderHandle>;
  }
}

const DB_NAME = "phd_master_workspace_folder";
const STORE_NAME = "handles";
const HANDLE_KEY = "workspace-folder";

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredFolder(): Promise<LocalFolderHandle | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(HANDLE_KEY);
    request.onsuccess = () => { db.close(); resolve((request.result as LocalFolderHandle | undefined) ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function storeFolder(folder: LocalFolderHandle) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(folder, HANDLE_KEY);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function forgetFolder() {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(HANDLE_KEY);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function ensureFolderPermission(folder: LocalFolderHandle, request = false) {
  const mode = { mode: "readwrite" as const };
  const current = await folder.queryPermission?.(mode);
  if (current === "granted") return true;
  if (!request) return false;
  return (await folder.requestPermission?.(mode)) === "granted";
}

export async function readFolderJson<T>(folder: LocalFolderHandle, filename: string): Promise<T | null> {
  try {
    const fileHandle = await folder.getFileHandle(filename);
    const text = await (await fileHandle.getFile()).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeFolderJson(folder: LocalFolderHandle, filename: string, value: unknown) {
  const fileHandle = await folder.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(value, null, 2));
  await writable.close();
}
