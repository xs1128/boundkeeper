import type { CaseLogEntry } from "./types";

const DB_NAME = "labor-filter-case-log";
const DB_VERSION = 1;
const STORE_NAME = "entries";

export class CaseLogStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaseLogStorageError";
  }
}

function assertBrowserStorage(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new CaseLogStorageError("IndexedDB is not available in this environment.");
  }

  return indexedDB;
}

function openDatabase(): Promise<IDBDatabase> {
  const idb = assertBrowserStorage();

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(new CaseLogStorageError("Unable to open local case log."));
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = operation(store);

        transaction.oncomplete = () => {
          database.close();
          resolve(request.result);
        };
        transaction.onerror = () => {
          database.close();
          reject(new CaseLogStorageError("Unable to access local case log."));
        };
        request.onerror = () => {
          database.close();
          reject(new CaseLogStorageError("Unable to access local case log."));
        };
      }),
  );
}

export async function listCaseEntries(): Promise<CaseLogEntry[]> {
  const entries = await runTransaction("readonly", (store) => store.getAll());
  return entries.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function saveCaseEntry(entry: CaseLogEntry): Promise<void> {
  await runTransaction("readwrite", (store) => store.put(entry));
}

export async function clearCaseEntries(): Promise<void> {
  await runTransaction("readwrite", (store) => store.clear());
}
