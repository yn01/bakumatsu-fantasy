import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CollisionSystem } from './CollisionSystem'
import type { MapRenderer } from './MapRenderer'

function createMockMapRenderer(options: {
  tileSize?: number
  mapWidth?: number
  mapHeight?: number
  collisionAt?: boolean
} = {}): MapRenderer {
  // 論理座標系のタイルサイズ（Phase 13で32→16へ変更）
  const tileSize = options.tileSize ?? 16
  const mapWidth = (options.mapWidth ?? 5) * tileSize
  const mapHeight = (options.mapHeight ?? 5) * tileSize
  const collisionAt = options.collisionAt ?? false

  return {
    getMapData: vi.fn(() => ({ tileSize })),
    getTileSize: vi.fn(() => tileSize),
    getMapSize: vi.fn(() => ({ width: mapWidth, height: mapHeight })),
    getCollisionAt: vi.fn(() => collisionAt),
  } as unknown as MapRenderer
}

describe('CollisionSystem', () => {
  let system: CollisionSystem

  beforeEach(() => {
    system = new CollisionSystem()
  })

  describe('canMoveTo without mapRenderer', () => {
    it('returns false when no mapRenderer is set', () => {
      expect(system.canMoveTo({ x: 0, y: 0 })).toBe(false)
    })
  })

  describe('canMoveTo with mapRenderer', () => {
    it('returns true for walkable tile', () => {
      const renderer = createMockMapRenderer({ collisionAt: false })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 2, y: 2 })).toBe(true)
    })

    it('returns false for non-walkable tile (collision=true)', () => {
      const renderer = createMockMapRenderer({ collisionAt: true })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 2, y: 2 })).toBe(false)
    })

    it('returns false for negative x coordinate (out of bounds)', () => {
      const renderer = createMockMapRenderer({ collisionAt: false })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: -1, y: 0 })).toBe(false)
    })

    it('returns false for negative y coordinate (out of bounds)', () => {
      const renderer = createMockMapRenderer({ collisionAt: false })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 0, y: -1 })).toBe(false)
    })

    it('returns false for x >= mapWidth in tiles (out of bounds)', () => {
      const renderer = createMockMapRenderer({ collisionAt: false, mapWidth: 5 })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 5, y: 0 })).toBe(false)
    })

    it('returns false for y >= mapHeight in tiles (out of bounds)', () => {
      const renderer = createMockMapRenderer({ collisionAt: false, mapHeight: 5 })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 0, y: 5 })).toBe(false)
    })

    it('returns true for position at (0, 0)', () => {
      const renderer = createMockMapRenderer({ collisionAt: false })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 0, y: 0 })).toBe(true)
    })

    it('returns true for last valid tile position', () => {
      const renderer = createMockMapRenderer({ collisionAt: false, mapWidth: 5, mapHeight: 5 })
      system.setMapRenderer(renderer)
      expect(system.canMoveTo({ x: 4, y: 4 })).toBe(true)
    })
  })

  describe('canMoveToPixel', () => {
    it('returns false when no mapRenderer', () => {
      expect(system.canMoveToPixel(64, 64)).toBe(false)
    })

    it('converts pixel to tile and checks walkable', () => {
      const renderer = createMockMapRenderer({ collisionAt: false, tileSize: 16 })
      system.setMapRenderer(renderer)
      // pixel (64,64) => tile (2,2)
      expect(system.canMoveToPixel(64, 64)).toBe(true)
    })

    it('converts pixel to tile and checks collision', () => {
      const renderer = createMockMapRenderer({ collisionAt: true, tileSize: 16 })
      system.setMapRenderer(renderer)
      expect(system.canMoveToPixel(64, 64)).toBe(false)
    })
  })

  describe('getMapSizeInTiles', () => {
    it('returns null when no mapRenderer', () => {
      expect(system.getMapSizeInTiles()).toBeNull()
    })

    it('returns map size in tiles', () => {
      const renderer = createMockMapRenderer({ tileSize: 16, mapWidth: 10, mapHeight: 8 })
      system.setMapRenderer(renderer)
      const size = system.getMapSizeInTiles()
      expect(size).toEqual({ width: 10, height: 8 })
    })
  })
})
