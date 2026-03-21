// [SkinRenderer] Canvas 2D rendering engine for Winamp-sik skins
// Modern resolution rendering with classic Winamp aesthetic
// Uses devicePixelRatio for crisp HiDPI rendering

import { SKIN_COLORS } from '@/stores/useSkinStore.js'

/**
 * Configure a canvas for HiDPI rendering.
 * The canvas internal resolution is scaled by devicePixelRatio,
 * while CSS keeps it at the logical size.
 */
export function setupCanvas(canvas, width, height, renderMode) {
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = renderMode === 'modern'
  return ctx
}

/**
 * Draw the metallic grey background.
 */
export function drawBackground(ctx, width, height) {
  ctx.fillStyle = SKIN_COLORS.background
  ctx.fillRect(0, 0, width, height)
}

/**
 * Draw a 3D button (outset/inset style) — classic beveled look.
 */
export function drawButton(ctx, x, y, w, h, state = 'normal', label = '') {
  const isPressed = state === 'pressed'
  const isDisabled = state === 'disabled'
  const isHover = state === 'hover'

  const lightEdge = isPressed ? SKIN_COLORS.darkEdge : SKIN_COLORS.lightEdge
  const darkEdge = isPressed ? SKIN_COLORS.lightEdge : SKIN_COLORS.darkEdge
  const face = isDisabled ? SKIN_COLORS.disabledControls : SKIN_COLORS.background

  // Button face
  ctx.fillStyle = face
  ctx.fillRect(x, y, w, h)

  // Beveled edges (2px for more visible 3D at modern resolution)
  ctx.fillStyle = lightEdge
  ctx.fillRect(x, y, w, 2)       // top
  ctx.fillRect(x, y, 2, h)       // left

  ctx.fillStyle = darkEdge
  ctx.fillRect(x, y + h - 2, w, 2) // bottom
  ctx.fillRect(x + w - 2, y, 2, h) // right

  // Hover highlight
  if (isHover) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4)
  }

  // Label text
  if (label) {
    ctx.fillStyle = isDisabled ? '#777' : SKIN_COLORS.textPrimary
    ctx.font = 'bold 11px "Courier New", "Consolas", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + w / 2, y + h / 2 + 1)
  }
}

/**
 * Draw a slider (seek bar or volume) with groove + thumb.
 */
export function drawSlider(ctx, x, y, width, height, value, min, max) {
  const ratio = max > min ? (value - min) / (max - min) : 0
  const fillWidth = Math.round(width * ratio)
  const thumbX = x + fillWidth

  // Track groove (inset)
  ctx.fillStyle = '#111'
  ctx.fillRect(x, y, width, height)

  // Inset border
  ctx.fillStyle = SKIN_COLORS.darkEdge
  ctx.fillRect(x, y, width, 1)
  ctx.fillRect(x, y, 1, height)
  ctx.fillStyle = SKIN_COLORS.lightEdge
  ctx.fillRect(x, y + height - 1, width, 1)
  ctx.fillRect(x + width - 1, y, 1, height)

  // Track fill (green bar)
  if (fillWidth > 0) {
    ctx.fillStyle = SKIN_COLORS.textPrimary
    ctx.fillRect(x + 1, y + 1, Math.max(0, fillWidth - 2), height - 2)
  }

  // Thumb
  const thumbW = 14
  const thumbH = height + 6
  const thumbY = y - 3
  drawButton(ctx, Math.max(x, thumbX - thumbW / 2), thumbY, thumbW, thumbH, 'normal')
}

/**
 * Draw text in the classic Winamp monospace style.
 * Uses proper font rendering (not char-by-char) for crisp output.
 */
export function drawBitmapText(ctx, text, x, y, fontSize = 12, _legacy = undefined, color = SKIN_COLORS.textPrimary) { // eslint-disable-line no-unused-vars
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px "Courier New", "Consolas", monospace`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
}

/**
 * Measure text width for scroll calculations.
 */
export function measureText(ctx, text, fontSize = 12) {
  ctx.font = `bold ${fontSize}px "Courier New", "Consolas", monospace`
  return ctx.measureText(text).width
}

/**
 * Draw scrolling text with horizontal offset, clipped to a region.
 */
export function drawScrollingText(ctx, text, x, y, width, offset, fontSize = 12, _legacy = undefined, color = SKIN_COLORS.textPrimary) { // eslint-disable-line no-unused-vars
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, fontSize + 4)
  ctx.clip()

  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px "Courier New", "Consolas", monospace`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const textWidth = ctx.measureText(text).width
  const gap = 60 // gap between repeated text

  ctx.fillText(text, x - offset, y)

  // Second copy for seamless looping
  if (offset > 0) {
    ctx.fillText(text, x - offset + textWidth + gap, y)
  }

  ctx.restore()
}

export default {
  setupCanvas,
  drawBackground,
  drawButton,
  drawSlider,
  drawBitmapText,
  measureText,
  drawScrollingText
}
