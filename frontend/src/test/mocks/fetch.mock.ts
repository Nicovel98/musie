/**
 * Mock implementation of Fetch API for testing
 * Provides mock responses for file uploads, covers, and metadata lookups
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from 'vitest'

/**
 * Mock Response object
 */
class MockResponse {
  body: any
  status: number
  statusText: string
  headers: Map<string, string>
  ok: boolean

  constructor(body: any = null, init: any = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.ok = this.status >= 200 && this.status < 300
    this.headers = new Map()
  }

  json = vi.fn(async () => {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  })

  text = vi.fn(async () => {
    return String(this.body)
  })

  blob = vi.fn(async () => {
    return new Blob([this.body])
  })

  arrayBuffer = vi.fn(async () => {
    const text = String(this.body)
    const encoder = new TextEncoder()
    return encoder.encode(text).buffer
  })

  clone = vi.fn(() => {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
    })
  })
}

/**
 * Mock fetch function
 */
export const mockFetch = vi.fn(async (url: string, init: any = {}) => {
  // Cover lookup endpoint
  if (url.includes('itunes.apple.com') || url.includes('cover')) {
    return new MockResponse(
      JSON.stringify({
        results: [
          {
            artworkUrl100: 'https://example.com/cover.jpg',
            collectionName: 'Test Album',
          },
        ],
      }),
    )
  }

  // File upload endpoint
  if (url.includes('upload') || init.method === 'POST') {
    return new MockResponse(
      JSON.stringify({
        success: true,
        filename: 'test-track.mp3',
        size: 5242880,
      }),
    )
  }

  // Default success response
  return new MockResponse(JSON.stringify({}))
})

/**
 * Setup global fetch mock
 */
export function setupFetchMock(): void {
  if (typeof globalThis !== 'undefined') {
    globalThis.fetch = mockFetch as any
    globalThis.Response = MockResponse as any
    const MockBlobClass = class MockBlob {
      parts: any
      options: any
      constructor(parts?: any, options?: any) {
        this.parts = parts || []
        this.options = options || {}
      }
    }
    ;(globalThis as any).Blob = MockBlobClass
  }
}

/**
 * Cleanup fetch mock
 */
export function cleanupFetchMock(): void {
  vi.clearAllMocks()
  mockFetch.mockClear()
}

// Export classes for testing
export { MockResponse }
