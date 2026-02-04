/**
 * バトル状態管理
 */

import { create } from 'zustand'
import { BattlePhase } from '@/types'
import type { BattleParticipant, BattleAction, BattleResult } from '@/types'

interface BattleState {
  // バトルフェーズ
  phase: BattlePhase

  // ターン数
  turn: number

  // パーティ
  party: BattleParticipant[]

  // 敵
  enemies: BattleParticipant[]

  // アクションキュー
  actionQueue: BattleAction[]

  // 現在行動中のキャラID
  currentActorId: string | null

  // バトル結果
  result: BattleResult | null

  // アクション
  initBattle: (party: BattleParticipant[], enemies: BattleParticipant[]) => void
  setPhase: (phase: BattlePhase) => void
  addAction: (action: BattleAction) => void
  executeNextAction: () => BattleAction | null
  updateParticipant: (
    id: string,
    updates: Partial<BattleParticipant>
  ) => void
  setCurrentActor: (id: string | null) => void
  nextTurn: () => void
  endBattle: (result: BattleResult) => void
  resetBattle: () => void
}

export const useBattleStore = create<BattleState>((set, get) => ({
  // 初期状態
  phase: BattlePhase.INIT,
  turn: 0,
  party: [],
  enemies: [],
  actionQueue: [],
  currentActorId: null,
  result: null,

  // アクション
  initBattle: (party, enemies) =>
    set({
      phase: BattlePhase.COMMAND_SELECT,
      turn: 1,
      party,
      enemies,
      actionQueue: [],
      currentActorId: null,
      result: null,
    }),

  setPhase: (phase) => set({ phase }),

  addAction: (action) =>
    set((state) => ({
      actionQueue: [...state.actionQueue, action],
    })),

  executeNextAction: () => {
    const { actionQueue } = get()
    if (actionQueue.length === 0) return null

    const nextAction = actionQueue[0]
    if (!nextAction) return null

    const rest = actionQueue.slice(1)
    set({
      actionQueue: rest,
      currentActorId: nextAction.actorId,
    })

    return nextAction
  },

  updateParticipant: (id, updates) =>
    set((state) => ({
      party: state.party.map((p) =>
        p.character.id === id ? { ...p, ...updates } : p
      ),
      enemies: state.enemies.map((e) =>
        e.character.id === id ? { ...e, ...updates } : e
      ),
    })),

  setCurrentActor: (id) => set({ currentActorId: id }),

  nextTurn: () =>
    set((state) => ({
      turn: state.turn + 1,
      phase: BattlePhase.COMMAND_SELECT,
      actionQueue: [],
    })),

  endBattle: (result) =>
    set({
      phase: result.victory ? BattlePhase.VICTORY : BattlePhase.DEFEAT,
      result,
    }),

  resetBattle: () =>
    set({
      phase: BattlePhase.INIT,
      turn: 0,
      party: [],
      enemies: [],
      actionQueue: [],
      currentActorId: null,
      result: null,
    }),
}))
