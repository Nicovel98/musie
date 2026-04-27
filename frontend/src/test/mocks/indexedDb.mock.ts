/**
 * Mock implementation of IndexedDB for testing
 * Provides a mock IDBDatabase, IDBObjectStore, and related objects
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { vi } from 'vitest'

/**
 * Mock IDBObjectStore
 */
class MockIDBObjectStore {
  private data: Map<string, any> = new Map()

  add = vi.fn((value: any) => {
    const key = value.id || Math.random().toString()
    this.data.set(key, value)
    return {
      result: key,
      onsuccess: null,
      onerror: null,
    }
  })

  put = vi.fn((value: any) => {
    const key = value.id || Math.random().toString()
    this.data.set(key, value)
    return { result: key }
  })

  get = vi.fn((key: string) => {
    return {
      result: this.data.get(key),
    }
  })

  getAll = vi.fn(() => {
    return {
      result: Array.from(this.data.values()),
    }
  })

  delete = vi.fn((key: string) => {
    this.data.delete(key)
    return { result: undefined }
  })

  clear = vi.fn(() => {
    this.data.clear()
    return { result: undefined }
  })

  createIndex = vi.fn(() => {
    return {}
  })
}

/**
 * Mock IDBTransaction
 */
class MockIDBTransaction {
  objectStore = vi.fn(() => new MockIDBObjectStore())
  oncomplete: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onabort: ((event: any) => void) | null = null

  complete() {
    if (this.oncomplete) {
      this.oncomplete({ type: 'complete' })
    }
  }
}

/**
 * Mock IDBDatabase
 */
class MockIDBDatabase {
  name: string = 'musie-db'
  version: number = 1
  objectStoreNames: string[] = ['tracks', 'playlists']

  transaction = vi.fn((_storeNames: string | string[]) => {
    const tx = new MockIDBTransaction()
    return tx
  })

  createObjectStore = vi.fn((_name: string) => {
    const store = new MockIDBObjectStore()
    return store
  })

  deleteObjectStore = vi.fn((_name: string) => {
    // Mock delete
  })

  close = vi.fn(() => {})
}

/**
 * Mock IDBOpenDBRequest
 */
class MockIDBOpenDBRequest {
  result: MockIDBDatabase | null = null
  onsuccess: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onupgradeneeded: ((event: unknown) => void) | null = null

  constructor() {
    this.result = new MockIDBDatabase()
    // Simulate async success
    setTimeout(() => {
      if (this.onsuccess) {
        this.onsuccess({ type: 'success', target: { result: this.result } })
      }
    }, 0)
  }
}

/**
 * Mock IndexedDB (IDBFactory)
 */
class MockIndexedDB {
  open = vi.fn((_name: string, _version?: number) => {
    return new MockIDBOpenDBRequest()
  })

  deleteDatabase = vi.fn((_name: string) => {
    return { result: undefined }
  })

  databases = vi.fn(() => {
    return Promise.resolve([])
  })

  cmp = vi.fn((a: any, b: any) => {
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })
}

/**
 * Setup IndexedDB mock
 */
export function setupIndexedDBMock(): void {
  if (typeof globalThis !== 'undefined') {
    globalThis.indexedDB = new MockIndexedDB() as any
    globalThis.IDBDatabase = MockIDBDatabase as any
    globalThis.IDBObjectStore = MockIDBObjectStore as any
    globalThis.IDBTransaction = MockIDBTransaction as any
  }
}

/**
 * Cleanup IndexedDB mock
 */
export function cleanupIndexedDBMock(): void {
  vi.clearAllMocks()
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).indexedDB
  }
}

// Export classes for testing
export { MockIDBDatabase, MockIDBObjectStore, MockIDBTransaction, MockIndexedDB }
