/**
 * useInput - 統合入力フック（useKeyboardのドロップイン置き換え）
 */

import { useEffect, useCallback, useRef } from 'react'
import { inputManager } from '@/systems/input/InputManager'
import type { GameAction } from '@/systems/input/InputManager'

// Re-export for backward compatibility
export type { GameAction }
export type GameKey = GameAction

let nextSubscriberId = 0

interface UseInputOptions {
  enabled?: boolean
  onKeyDown?: (action: GameAction) => void
  onKeyUp?: (action: GameAction) => void
  priority?: number
}

export const useInput = (options: UseInputOptions = {}) => {
  const { enabled = true, onKeyDown, onKeyUp, priority } = options
  const onKeyDownRef = useRef(onKeyDown)
  const onKeyUpRef = useRef(onKeyUp)
  const subscriberIdRef = useRef<string>('')

  // Assign a stable unique ID on first render
  if (subscriberIdRef.current === '') {
    subscriberIdRef.current = `useInput_${nextSubscriberId++}`
  }

  // Compute priority: use provided or based on mount order
  const priorityRef = useRef(priority ?? nextSubscriberId)

  // Keep refs up to date
  onKeyDownRef.current = onKeyDown
  onKeyUpRef.current = onKeyUp

  // Initialize InputManager on first use
  useEffect(() => {
    inputManager.initialize()
  }, [])

  // Subscribe/unsubscribe and manage polling
  useEffect(() => {
    const id = subscriberIdRef.current

    inputManager.subscribe({
      id,
      enabled,
      priority: priority ?? priorityRef.current,
      onAction: (action: GameAction) => {
        onKeyDownRef.current?.(action)
      },
      onActionUp: (action: GameAction) => {
        onKeyUpRef.current?.(action)
      },
    })

    if (enabled) {
      inputManager.startPolling()
    }

    return () => {
      inputManager.unsubscribe(id)
      if (enabled) {
        inputManager.stopPolling()
      }
    }
  }, [enabled, priority])

  return {
    isPressed: useCallback(
      (action: GameAction) => inputManager.isPressed(action),
      []
    ),
    isJustPressed: useCallback(
      (action: GameAction) => inputManager.isJustPressed(action),
      []
    ),
    isJustReleased: useCallback(
      (action: GameAction) => inputManager.isJustReleased(action),
      []
    ),
    clearJustKeys: useCallback(() => inputManager.clearJustKeys(), []),
  }
}
