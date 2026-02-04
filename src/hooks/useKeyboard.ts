/**
 * キーボード入力管理フック
 */

import { useEffect, useCallback, useRef } from 'react'

/** キーマッピング */
const KEY_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'confirm',
  Space: 'confirm',
  ' ': 'confirm',
  Escape: 'cancel',
  KeyX: 'cancel',
  KeyZ: 'confirm',
} as const

export type GameKey = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel'

interface KeyState {
  pressed: Set<GameKey>
  justPressed: Set<GameKey>
  justReleased: Set<GameKey>
}

interface UseKeyboardOptions {
  enabled?: boolean
  onKeyDown?: (key: GameKey) => void
  onKeyUp?: (key: GameKey) => void
}

export const useKeyboard = (options: UseKeyboardOptions = {}) => {
  const { enabled = true, onKeyDown, onKeyUp } = options

  const keyStateRef = useRef<KeyState>({
    pressed: new Set(),
    justPressed: new Set(),
    justReleased: new Set(),
  })

  // キーリピート防止用
  const keyRepeatRef = useRef<Set<string>>(new Set())

  const clearJustKeys = useCallback(() => {
    keyStateRef.current.justPressed.clear()
    keyStateRef.current.justReleased.clear()
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // フォーム要素（input, textarea, contenteditable）では処理しない
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // キーリピート防止
      if (keyRepeatRef.current.has(event.code)) return

      const gameKey = KEY_MAP[event.code as keyof typeof KEY_MAP]
      if (!gameKey) return

      // デフォルト動作を防止（スクロールなど）
      event.preventDefault()

      keyRepeatRef.current.add(event.code)
      keyStateRef.current.pressed.add(gameKey)
      keyStateRef.current.justPressed.add(gameKey)

      onKeyDown?.(gameKey)
    },
    [enabled, onKeyDown]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const gameKey = KEY_MAP[event.code as keyof typeof KEY_MAP]
      if (!gameKey) return

      event.preventDefault()

      keyRepeatRef.current.delete(event.code)
      keyStateRef.current.pressed.delete(gameKey)
      keyStateRef.current.justReleased.add(gameKey)

      onKeyUp?.(gameKey)
    },
    [enabled, onKeyUp]
  )

  // ウィンドウフォーカス喪失時に全キー状態をリセット
  const handleBlur = useCallback(() => {
    keyStateRef.current.pressed.clear()
    keyStateRef.current.justPressed.clear()
    keyStateRef.current.justReleased.clear()
    keyRepeatRef.current.clear()
  }, [])

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      keyStateRef.current.pressed.clear()
      keyStateRef.current.justPressed.clear()
      keyStateRef.current.justReleased.clear()
      keyRepeatRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, handleKeyDown, handleKeyUp, handleBlur, handleVisibilityChange])

  return {
    isPressed: useCallback(
      (key: GameKey) => keyStateRef.current.pressed.has(key),
      []
    ),
    isJustPressed: useCallback(
      (key: GameKey) => keyStateRef.current.justPressed.has(key),
      []
    ),
    isJustReleased: useCallback(
      (key: GameKey) => keyStateRef.current.justReleased.has(key),
      []
    ),
    clearJustKeys,
  }
}
