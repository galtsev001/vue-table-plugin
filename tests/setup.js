import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: (key) => null,
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {}
  })
})

// Mock resize event
global.resizeTo = (width, height) => {
  window.innerWidth = width || window.innerWidth
  window.innerHeight = height || window.innerHeight
  window.dispatchEvent(new Event('resize'))
}
