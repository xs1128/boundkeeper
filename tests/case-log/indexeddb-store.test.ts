import { afterEach, describe, expect, it, vi } from "vitest";
import { listCaseEntries } from "../../src/case-log/store";

type Handler = (() => void) | null;

function createFakeOpenRequest(options: {
  failOpen?: boolean;
  storeReady?: boolean;
  failTransaction?: boolean;
}) {
  const request: {
    result: IDBDatabase | null;
    transaction: IDBTransaction | null;
    onsuccess: Handler;
    onerror: Handler;
    onupgradeneeded: Handler;
    onblocked: Handler;
  } = {
    result: null,
    transaction: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    onblocked: null,
  };

  queueMicrotask(() => {
    if (options.failOpen) {
      request.onerror?.();
      return;
    }

    const storeReady = options.storeReady !== false;
    const database = {
      objectStoreNames: {
        contains: (name: string) => storeReady && name === "entries",
      },
      close: vi.fn(),
      transaction: () => {
        if (options.failTransaction) {
          throw new Error("NotFoundError");
        }
        const tx = {
          oncomplete: null as Handler,
          onerror: null as Handler,
          objectStore: () => ({
            getAll: () => {
              const readRequest = { result: [] as unknown[], onerror: null as Handler };
              queueMicrotask(() => tx.oncomplete?.());
              return readRequest;
            },
          }),
        };
        return tx;
      },
    } as unknown as IDBDatabase;

    request.result = database;
    if (!storeReady) {
      request.onupgradeneeded?.();
    }
    request.onsuccess?.();
  });

  return request;
}

describe("listCaseEntries IndexedDB access", () => {
  const originalIndexedDb = globalThis.indexedDB;

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: originalIndexedDb,
    });
  });

  it("retries when the first open fails and then lists an empty log", async () => {
    let opens = 0;
    const indexedDB = {
      open: () => {
        opens += 1;
        return createFakeOpenRequest({ failOpen: opens === 1 });
      },
    };
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: indexedDB,
    });

    await expect(listCaseEntries()).resolves.toEqual({ entries: [], skippedCount: 0 });
    expect(opens).toBe(2);
  });

  it("retries when the first transaction cannot see the new store", async () => {
    let opens = 0;
    const indexedDB = {
      open: () => {
        opens += 1;
        return createFakeOpenRequest({ failTransaction: opens === 1 });
      },
    };
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: indexedDB,
    });

    await expect(listCaseEntries()).resolves.toEqual({ entries: [], skippedCount: 0 });
    expect(opens).toBeGreaterThan(1);
  });
});
