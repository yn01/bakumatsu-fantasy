import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/stores/gameStore'
import { resetAllStores } from '@/test/helpers'

describe('gameStore', () => {
  beforeEach(() => {
    resetAllStores()
  })

  describe('setScene', () => {
    it('changes the scene', () => {
      useGameStore.getState().setScene('field')
      expect(useGameStore.getState().scene).toBe('field')
    })

    it('can switch between scenes', () => {
      useGameStore.getState().setScene('battle')
      expect(useGameStore.getState().scene).toBe('battle')
      useGameStore.getState().setScene('title')
      expect(useGameStore.getState().scene).toBe('title')
    })
  })

  describe('setPaused', () => {
    it('sets paused state', () => {
      useGameStore.getState().setPaused(true)
      expect(useGameStore.getState().paused).toBe(true)
    })

    it('can unpause', () => {
      useGameStore.getState().setPaused(true)
      useGameStore.getState().setPaused(false)
      expect(useGameStore.getState().paused).toBe(false)
    })
  })

  describe('openShop / closeShop', () => {
    it('opens a shop with type', () => {
      useGameStore.getState().openShop('weapon')
      const state = useGameStore.getState()
      expect(state.shopOpen).toBe(true)
      expect(state.shopType).toBe('weapon')
      expect(state.shopId).toBeNull()
    })

    it('opens a shop with type and id', () => {
      useGameStore.getState().openShop('item', 'shop_kochi')
      const state = useGameStore.getState()
      expect(state.shopOpen).toBe(true)
      expect(state.shopType).toBe('item')
      expect(state.shopId).toBe('shop_kochi')
    })

    it('closes the shop', () => {
      useGameStore.getState().openShop('all')
      useGameStore.getState().closeShop()
      const state = useGameStore.getState()
      expect(state.shopOpen).toBe(false)
      expect(state.shopType).toBeNull()
      expect(state.shopId).toBeNull()
    })
  })

  describe('updateSettings', () => {
    it('updates bgm volume', () => {
      useGameStore.getState().updateSettings({ bgmVolume: 0.3 })
      expect(useGameStore.getState().settings.bgmVolume).toBe(0.3)
    })

    it('merges settings partially', () => {
      useGameStore.getState().updateSettings({ bgmVolume: 0.3 })
      const settings = useGameStore.getState().settings
      expect(settings.bgmVolume).toBe(0.3)
      expect(settings.seVolume).toBe(0.7) // unchanged
    })
  })

  describe('setDifficulty', () => {
    it('sets the difficulty', () => {
      useGameStore.getState().setDifficulty('hard')
      expect(useGameStore.getState().difficulty).toBe('hard')
    })
  })

  describe('resetGame', () => {
    it('resets all game state', () => {
      useGameStore.getState().setScene('battle')
      useGameStore.getState().setPaused(true)
      useGameStore.getState().openShop('weapon')
      useGameStore.getState().setDifficulty('hard')
      useGameStore.getState().resetGame()

      const state = useGameStore.getState()
      expect(state.scene).toBe('title')
      expect(state.paused).toBe(false)
      expect(state.shopOpen).toBe(false)
      expect(state.shopType).toBeNull()
      expect(state.shopId).toBeNull()
      expect(state.difficulty).toBe('normal')
    })
  })
})
