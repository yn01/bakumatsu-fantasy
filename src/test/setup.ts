import { vi } from 'vitest'

// Global fetch mock
global.fetch = vi.fn()

// localStorage mock
const localStorageStore: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((key) => delete localStorageStore[key])
  }),
  get length() {
    return Object.keys(localStorageStore).length
  },
  key: vi.fn((index: number) => Object.keys(localStorageStore)[index] ?? null),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })

// Canvas mock
class CanvasRenderingContext2DMock {
  canvas = { width: 640, height: 480 }
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 1
  font = ''
  textAlign = 'left' as CanvasTextAlign
  globalAlpha = 1
  clearRect = vi.fn()
  fillRect = vi.fn()
  strokeRect = vi.fn()
  fillText = vi.fn()
  strokeText = vi.fn()
  drawImage = vi.fn()
  beginPath = vi.fn()
  moveTo = vi.fn()
  lineTo = vi.fn()
  arc = vi.fn()
  closePath = vi.fn()
  stroke = vi.fn()
  fill = vi.fn()
  save = vi.fn()
  restore = vi.fn()
  translate = vi.fn()
  scale = vi.fn()
  rotate = vi.fn()
  clip = vi.fn()
  measureText = vi.fn(() => ({ width: 0 }))
  createLinearGradient = vi.fn(() => ({
    addColorStop: vi.fn(),
  }))
  setTransform = vi.fn()
  getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(4) }))
  putImageData = vi.fn()
}

class HTMLCanvasMock {
  width = 640
  height = 480
  getContext = vi.fn((_type: string) => new CanvasRenderingContext2DMock())
  toDataURL = vi.fn(() => '')
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

Object.defineProperty(global, 'HTMLCanvasElement', {
  value: HTMLCanvasMock,
  writable: true,
})
