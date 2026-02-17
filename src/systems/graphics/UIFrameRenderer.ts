/**
 * Japanese-style window frame renderer
 * Draws wood-grain bordered frames with corner decorations
 */

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const borderWidth = 4

  // Semi-transparent inner area
  ctx.fillStyle = 'rgba(20, 15, 10, 0.85)'
  ctx.fillRect(x, y, width, height)

  // Wood-grain border
  const woodColor1 = '#5a3a1a'
  const woodColor2 = '#7a5a3a'

  // Top border
  ctx.fillStyle = woodColor1
  ctx.fillRect(x, y, width, borderWidth)
  ctx.fillStyle = woodColor2
  ctx.fillRect(x + 2, y + 1, width - 4, 2)

  // Bottom border
  ctx.fillStyle = woodColor1
  ctx.fillRect(x, y + height - borderWidth, width, borderWidth)
  ctx.fillStyle = woodColor2
  ctx.fillRect(x + 2, y + height - borderWidth + 1, width - 4, 2)

  // Left border
  ctx.fillStyle = woodColor1
  ctx.fillRect(x, y, borderWidth, height)
  ctx.fillStyle = woodColor2
  ctx.fillRect(x + 1, y + 2, 2, height - 4)

  // Right border
  ctx.fillStyle = woodColor1
  ctx.fillRect(x + width - borderWidth, y, borderWidth, height)
  ctx.fillStyle = woodColor2
  ctx.fillRect(x + width - borderWidth + 1, y + 2, 2, height - 4)

  // Corner decorations (small squares)
  const cornerSize = 6
  ctx.fillStyle = '#c4a746'

  // Top-left
  ctx.fillRect(x + 1, y + 1, cornerSize, cornerSize)
  // Top-right
  ctx.fillRect(x + width - cornerSize - 1, y + 1, cornerSize, cornerSize)
  // Bottom-left
  ctx.fillRect(x + 1, y + height - cornerSize - 1, cornerSize, cornerSize)
  // Bottom-right
  ctx.fillRect(x + width - cornerSize - 1, y + height - cornerSize - 1, cornerSize, cornerSize)

  // Inner corner dots (gold detail)
  ctx.fillStyle = '#dab756'
  const dotSize = 2
  ctx.fillRect(x + cornerSize + 2, y + cornerSize + 2, dotSize, dotSize)
  ctx.fillRect(x + width - cornerSize - dotSize - 2, y + cornerSize + 2, dotSize, dotSize)
  ctx.fillRect(x + cornerSize + 2, y + height - cornerSize - dotSize - 2, dotSize, dotSize)
  ctx.fillRect(x + width - cornerSize - dotSize - 2, y + height - cornerSize - dotSize - 2, dotSize, dotSize)
}
