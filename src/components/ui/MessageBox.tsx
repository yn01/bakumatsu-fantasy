/**
 * MessageBox - 会話ウィンドウコンポーネント
 */

import { useEffect, useState } from 'react'

interface MessageBoxProps {
  /** 話者名 */
  speaker?: string
  /** メッセージ内容（配列の場合は複数ページ） */
  message: string | string[]
  /** 表示中フラグ */
  isVisible: boolean
  /** 閉じるコールバック */
  onClose: () => void
}

export const MessageBox = ({ speaker, message, isVisible, onClose }: MessageBoxProps) => {
  const [currentPage, setCurrentPage] = useState(0)

  // メッセージを配列に正規化
  const messages = Array.isArray(message) ? message : [message]
  const currentMessage = messages[currentPage]
  const hasNextPage = currentPage < messages.length - 1

  // リセット
  useEffect(() => {
    if (isVisible) {
      setCurrentPage(0)
    }
  }, [isVisible])

  // キーボード入力
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 決定キー（Enter, Space, Z）
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
        e.preventDefault()
        if (hasNextPage) {
          setCurrentPage((prev) => prev + 1)
        } else {
          onClose()
        }
      }
      // キャンセルキー（Escape, X）
      else if (e.key === 'Escape' || e.key === 'x') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, hasNextPage, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-end justify-center p-4 pointer-events-none">
      <div className="w-full max-w-2xl bg-gray-900 border-4 border-primary rounded-lg p-4 shadow-2xl pointer-events-auto">
        {/* 話者名 */}
        {speaker && (
          <div className="mb-2">
            <span className="inline-block bg-primary text-white px-3 py-1 rounded text-sm font-bold">
              {speaker}
            </span>
          </div>
        )}

        {/* メッセージ本文 */}
        <div className="text-white text-base leading-relaxed min-h-[4rem] whitespace-pre-wrap">
          {currentMessage}
        </div>

        {/* ページインジケーター */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <div>
            {messages.length > 1 && (
              <span>
                {currentPage + 1} / {messages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasNextPage ? (
              <>
                <span>Enter / Space / Z: 次へ</span>
                <span className="animate-pulse text-primary">▼</span>
              </>
            ) : (
              <>
                <span>Enter / Space / Z: 閉じる</span>
                <span className="animate-pulse text-primary">●</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
