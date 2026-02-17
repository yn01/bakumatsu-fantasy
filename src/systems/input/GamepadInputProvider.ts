/**
 * GamepadInputProvider - ゲームパッド入力プロバイダー
 */

import type { GameAction } from './InputManager'

interface GamepadActionState {
  pressed: boolean
  justPressed: boolean
}

/** 標準ゲームパッドボタンマッピング */
const DEFAULT_BUTTON_BINDINGS: Record<number, GameAction> = {
  0: 'confirm',   // A button
  1: 'cancel',    // B button
  9: 'menu',      // Start button
  12: 'up',       // D-pad up
  13: 'down',     // D-pad down
  14: 'left',     // D-pad left
  15: 'right',    // D-pad right
}

export class GamepadInputProvider {
  private deadzone: number = 0.3
  private previousButtonState: Map<number, boolean> = new Map()
  private buttonBindings: Record<number, GameAction> = { ...DEFAULT_BUTTON_BINDINGS }

  poll(): Map<GameAction, GamepadActionState> {
    const result = new Map<GameAction, GamepadActionState>()
    const gamepads = navigator.getGamepads()
    if (!gamepads) return result

    let gamepad: Gamepad | null = null
    for (const gp of gamepads) {
      if (gp && gp.connected) {
        gamepad = gp
        break
      }
    }
    if (!gamepad) return result

    // Button inputs
    for (const [buttonIndex, action] of Object.entries(this.buttonBindings)) {
      const idx = Number(buttonIndex)
      const button = gamepad.buttons[idx]
      if (!button) continue

      const wasPressed = this.previousButtonState.get(idx) ?? false
      const isPressed = button.pressed

      const existing = result.get(action)
      result.set(action, {
        pressed: (existing?.pressed ?? false) || isPressed,
        justPressed: (existing?.justPressed ?? false) || (isPressed && !wasPressed),
      })

      this.previousButtonState.set(idx, isPressed)
    }

    // Left stick axes
    if (gamepad.axes.length >= 2) {
      const axisX = gamepad.axes[0] ?? 0
      const axisY = gamepad.axes[1] ?? 0

      const stickActions: [GameAction, boolean][] = [
        ['left', axisX < -this.deadzone],
        ['right', axisX > this.deadzone],
        ['up', axisY < -this.deadzone],
        ['down', axisY > this.deadzone],
      ]

      for (const [action, isActive] of stickActions) {
        const existing = result.get(action)
        result.set(action, {
          pressed: (existing?.pressed ?? false) || isActive,
          justPressed: existing?.justPressed ?? false, // Stick doesn't trigger justPressed
        })
      }
    }

    return result
  }

  isConnected(): boolean {
    const gamepads = navigator.getGamepads()
    if (!gamepads) return false
    for (const gp of gamepads) {
      if (gp && gp.connected) return true
    }
    return false
  }

  getGamepadName(): string | null {
    const gamepads = navigator.getGamepads()
    if (!gamepads) return null
    for (const gp of gamepads) {
      if (gp && gp.connected) return gp.id
    }
    return null
  }

  setButtonBindings(bindings: Record<number, GameAction>): void {
    this.buttonBindings = { ...bindings }
  }

  setDeadzone(deadzone: number): void {
    this.deadzone = deadzone
  }
}
