/**
 * InputManager - 統合入力管理システム（シングルトン）
 */

import { GamepadInputProvider } from './GamepadInputProvider'
import { MouseTouchInputProvider } from './MouseTouchInputProvider'

export type GameAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'menu'

export interface InputBindings {
  keyboard: Record<string, GameAction>
  gamepad: Record<number, GameAction>
}

const DEFAULT_KEYBOARD_BINDINGS: Record<string, GameAction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  Enter: 'confirm',
  Space: 'confirm',
  ' ': 'confirm',
  KeyZ: 'confirm',
  Escape: 'cancel',
  KeyX: 'cancel',
}

const DEFAULT_GAMEPAD_BINDINGS: Record<number, GameAction> = {
  0: 'confirm',
  1: 'cancel',
  9: 'menu',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
}

export interface InputSubscriber {
  id: string
  onAction?: (action: GameAction) => void
  onActionUp?: (action: GameAction) => void
  enabled: boolean
  priority: number // higher = receives input first
}

class InputManager {
  private pressedActions: Set<GameAction> = new Set()
  private justPressedActions: Set<GameAction> = new Set()
  private justReleasedActions: Set<GameAction> = new Set()
  private keyRepeat: Set<string> = new Set()
  private previousGamepadPressed: Set<GameAction> = new Set()
  private bindings: InputBindings = {
    keyboard: { ...DEFAULT_KEYBOARD_BINDINGS },
    gamepad: { ...DEFAULT_GAMEPAD_BINDINGS },
  }
  private gamepadProvider: GamepadInputProvider = new GamepadInputProvider()
  private mouseProvider: MouseTouchInputProvider = new MouseTouchInputProvider()
  private _enabled: boolean = true
  private initialized: boolean = false
  private subscribers: Map<string, InputSubscriber> = new Map()
  private pollRafId: number | null = null
  private pollRefCount: number = 0

  /** @deprecated Use subscribe/unsubscribe instead */
  onAction: ((action: GameAction) => void) | null = null
  /** @deprecated Use subscribe/unsubscribe instead */
  onActionUp: ((action: GameAction) => void) | null = null

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this._enabled) return

    // Skip form elements
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Prevent key repeat
    if (this.keyRepeat.has(event.code)) return

    // Try event.code first, then event.key
    const action = this.bindings.keyboard[event.code] ?? this.bindings.keyboard[event.key]
    if (!action) return

    event.preventDefault()

    this.keyRepeat.add(event.code)
    this.pressedActions.add(action)
    this.justPressedActions.add(action)

    this.notifySubscribers(action, 'down')
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this._enabled) return

    const action = this.bindings.keyboard[event.code] ?? this.bindings.keyboard[event.key]
    if (!action) return

    event.preventDefault()

    this.keyRepeat.delete(event.code)
    this.pressedActions.delete(action)
    this.justReleasedActions.add(action)

    this.notifySubscribers(action, 'up')
  }

  private handleBlur = (): void => {
    this.pressedActions.clear()
    this.justPressedActions.clear()
    this.justReleasedActions.clear()
    this.keyRepeat.clear()
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.handleBlur()
    }
  }

  initialize(): void {
    if (this.initialized) return
    this.initialized = true

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.handleBlur)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  destroy(): void {
    if (!this.initialized) return
    this.initialized = false

    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.handleBlur)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)

    this.mouseProvider.destroy()
    this.handleBlur()
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled
    if (!enabled) {
      this.handleBlur()
    }
  }

  isEnabled(): boolean {
    return this._enabled
  }

  isPressed(action: GameAction): boolean {
    return this.pressedActions.has(action)
  }

  isJustPressed(action: GameAction): boolean {
    return this.justPressedActions.has(action)
  }

  isJustReleased(action: GameAction): boolean {
    return this.justReleasedActions.has(action)
  }

  clearJustKeys(): void {
    this.justPressedActions.clear()
    this.justReleasedActions.clear()
  }

  /** Subscribe to input events (multiple subscribers supported) */
  subscribe(subscriber: InputSubscriber): void {
    this.subscribers.set(subscriber.id, subscriber)
  }

  /** Unsubscribe from input events */
  unsubscribe(id: string): void {
    this.subscribers.delete(id)
  }

  /** Notify the highest-priority enabled subscriber */
  private notifySubscribers(action: GameAction, type: 'down' | 'up'): void {
    // Sort by priority descending
    const sorted = [...this.subscribers.values()]
      .filter((s) => s.enabled)
      .sort((a, b) => b.priority - a.priority)

    for (const sub of sorted) {
      const handler = type === 'down' ? sub.onAction : sub.onActionUp
      if (handler) {
        handler(action)
        return // Only highest-priority subscriber handles input
      }
    }

    // Fallback to legacy callbacks
    if (type === 'down') {
      this.onAction?.(action)
    } else {
      this.onActionUp?.(action)
    }
  }

  /** Start centralized gamepad polling (reference counted) */
  startPolling(): void {
    this.pollRefCount++
    if (this.pollRefCount === 1 && this.pollRafId === null) {
      const poll = () => {
        this.update()
        this.pollRafId = requestAnimationFrame(poll)
      }
      this.pollRafId = requestAnimationFrame(poll)
    }
  }

  /** Stop centralized gamepad polling (reference counted) */
  stopPolling(): void {
    this.pollRefCount = Math.max(0, this.pollRefCount - 1)
    if (this.pollRefCount === 0 && this.pollRafId !== null) {
      cancelAnimationFrame(this.pollRafId)
      this.pollRafId = null
    }
  }

  /** Poll gamepad state - call each frame */
  update(): void {
    if (!this._enabled) return

    const gamepadState = this.gamepadProvider.poll()
    const currentGamepadPressed = new Set<GameAction>()

    for (const [action, state] of gamepadState) {
      if (state.pressed) {
        currentGamepadPressed.add(action)
      }
      if (state.justPressed) {
        this.justPressedActions.add(action)
        this.pressedActions.add(action)
        this.notifySubscribers(action, 'down')
      }
    }

    // Detect gamepad button releases
    for (const action of this.previousGamepadPressed) {
      if (!currentGamepadPressed.has(action)) {
        this.pressedActions.delete(action)
        this.justReleasedActions.add(action)
        this.notifySubscribers(action, 'up')
      }
    }

    this.previousGamepadPressed = currentGamepadPressed
  }

  getBindings(): InputBindings {
    return {
      keyboard: { ...this.bindings.keyboard },
      gamepad: { ...this.bindings.gamepad },
    }
  }

  setBindings(bindings: Partial<InputBindings>): void {
    if (bindings.keyboard) {
      this.bindings.keyboard = { ...bindings.keyboard }
    }
    if (bindings.gamepad) {
      this.bindings.gamepad = { ...bindings.gamepad }
      this.gamepadProvider.setButtonBindings(bindings.gamepad)
    }
  }

  getGamepadProvider(): GamepadInputProvider {
    return this.gamepadProvider
  }

  getMouseProvider(): MouseTouchInputProvider {
    return this.mouseProvider
  }
}

export const inputManager = new InputManager()
