/**
 * 開発時のみ出力するログユーティリティ
 * 本番ビルドでは何も出力しない（console.warn/console.error はそのまま使用する）
 */

export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}
