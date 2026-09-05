import type { CaseLogEntry } from "./types";

const DB_NAME = "labor-filter-case-log";
const DB_VERSION = 1;
const STORE_NAME = "entries";
const OPEN_ATTEMPTS = 3;

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openDatabase(): Promise<IDBDatabase> {
  const idb = assertBrowserStorage();

  return new Promise((resolve, reject) => {
    let settled = false;
    const request = idb.open(DB_NAME, DB_VERSION);

    const fail = () => {
      if (settled) return;
      settled = true;
      reject(new CaseLogStorageError("Unable to open local case log."));
    };

    const succeed = (database: IDBDatabase) => {
      if (settled) return;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.close();
        fail();
        return;
      }
      settled = true;
      resolve(database);
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      const upgrade = request.transaction;
      if (upgrade && upgrade.readyState !== "done") {
        upgrade.oncomplete = () => succeed(database);
        upgrade.onerror = fail;
        upgrade.onabort = fail;
        return;
      }
      // WebKit can still miss the store for one turn after first-create onsuccess.
      queueMicrotask(() => succeed(database));
    };

    request.onerror = fail;
    request.onblocked = fail;
  });
}

async function openDatabaseWithRetry(): Promise<IDBDatabase> {
  let lastError: unknown;
  for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt += 1) {
    try {
      return await openDatabase();
    } catch (error) {
      lastError = error;
      if (attempt < OPEN_ATTEMPTS - 1) {
        await wait(40 * (attempt + 1));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new CaseLogStorageError("Unable to open local case log.");
}

function runTransactionOnce<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabaseWithRetry().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        try {
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
        } catch {
          database.close();
          reject(new CaseLogStorageError("Unable to access local case log."));
        }
      }),
  );
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt += 1) {
    try {
      return await runTransactionOnce(mode, operation);
    } catch (error) {
      lastError = error;
      if (attempt < OPEN_ATTEMPTS - 1) {
        await wait(40 * (attempt + 1));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new CaseLogStorageError("Unable to access local case log.");
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
