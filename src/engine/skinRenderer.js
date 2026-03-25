// [SkinRenderer] Canvas 2D rendering engine for SikAmp skins
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
 * Draw a sprite region from a source image to the canvas.
 * Used for rendering regions of WSZ sprite sheets (e.g., button states from cbuttons.bmp).
 */
export function drawSprite(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!image || sw <= 0 || sh <= 0) return false
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw !== undefined ? dw : sw, dh !== undefined ? dh : sh)
  return true
}

/**
 * Draw the background.
 * When a custom skin with main.bmp is active, the canvas is cleared to transparent
 * so the CSS background-image (main.bmp on .player-window) shows through.
 * Otherwise, fills with the skin's background color.
 */
export function drawBackground(ctx, width, height, skinStore) {
  if (skinStore && skinStore.isCustomSkin && skinStore.mainBmpUrl) {
    ctx.clearRect(0, 0, width, height)
    return
  }
  const colors = skinStore ? skinStore.colors : SKIN_COLORS
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)
}

/**
 * Winamp cbuttons.bmp sprite regions (standard layout: 136×36).
 * Each button: 23×18 pixels. Top row = normal, bottom row = pressed.
 */
export const CBUTTONS_REGIONS = {
  prev:  { normal: { sx: 0,  sy: 0, sw: 23, sh: 18 }, pressed: { sx: 0,  sy: 18, sw: 23, sh: 18 } },
  play:  { normal: { sx: 23, sy: 0, sw: 23, sh: 18 }, pressed: { sx: 23, sy: 18, sw: 23, sh: 18 } },
  pause: { normal: { sx: 46, sy: 0, sw: 23, sh: 18 }, pressed: { sx: 46, sy: 18, sw: 23, sh: 18 } },
  stop:  { normal: { sx: 69, sy: 0, sw: 23, sh: 18 }, pressed: { sx: 69, sy: 18, sw: 23, sh: 18 } },
  next:  { normal: { sx: 92, sy: 0, sw: 23, sh: 18 }, pressed: { sx: 92, sy: 18, sw: 23, sh: 18 } }
}

/**
 * Draw a 3D button (outset/inset style) — classic beveled look.
 * When spriteConfig is provided ({ image, normal: {sx,sy,sw,sh}, pressed: {...} }),
 * renders the sprite region instead of programmatic drawing.
 */
export function drawButton(ctx, x, y, w, h, state = 'normal', label = '', skinStore, spriteConfig) {
  // Sprite rendering path
  if (spriteConfig && spriteConfig.image) {
    const region = state === 'pressed' && spriteConfig.pressed ? spriteConfig.pressed : spriteConfig.normal
    if (region && drawSprite(ctx, spriteConfig.image, region.sx, region.sy, region.sw, region.sh, x, y, w, h)) {
      return
    }
  }

  const isPressed = state === 'pressed'
  const isDisabled = state === 'disabled'
  const isHover = state === 'hover'

  const colors = skinStore ? skinStore.colors : SKIN_COLORS
  const lightEdge = isPressed ? colors.darkEdge : colors.lightEdge
  const darkEdge = isPressed ? colors.lightEdge : colors.darkEdge
  const face = isDisabled ? colors.disabledControls : colors.background

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
    ctx.fillStyle = isDisabled ? '#777' : colors.textPrimary
    ctx.font = 'bold 11px "Courier New", "Consolas", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + w / 2, y + h / 2 + 1)
  }
}

/**
 * Draw a slider (seek bar or volume) with groove + thumb.
 */
export function drawSlider(ctx, x, y, width, height, value, min, max, skinStore) {
  const ratio = max > min ? (value - min) / (max - min) : 0
  const fillWidth = Math.round(width * ratio)
  const thumbX = x + fillWidth

  const colors = skinStore ? skinStore.colors : SKIN_COLORS

  // Track groove (inset)
  ctx.fillStyle = '#111'
  ctx.fillRect(x, y, width, height)

  // Inset border
  ctx.fillStyle = colors.darkEdge
  ctx.fillRect(x, y, width, 1)
  ctx.fillRect(x, y, 1, height)
  ctx.fillStyle = colors.lightEdge
  ctx.fillRect(x, y + height - 1, width, 1)
  ctx.fillRect(x + width - 1, y, 1, height)

  // Track fill (green bar)
  if (fillWidth > 0) {
    ctx.fillStyle = colors.textPrimary
    if (ctx.imageSmoothingEnabled) {
      ctx.shadowColor = colors.textPrimary
      ctx.shadowBlur = 6
    }
    ctx.fillRect(x + 1, y + 1, Math.max(0, fillWidth - 2), height - 2)
    if (ctx.imageSmoothingEnabled) {
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
    }
  }

  // Thumb
  const thumbW = 14
  const thumbH = height + 6
  const thumbY = y - 3
  drawButton(ctx, Math.max(x, thumbX - thumbW / 2), thumbY, thumbW, thumbH, 'normal', '', skinStore)
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

  // Modern mode: subtle glow effect on text
  if (ctx.imageSmoothingEnabled) {
    ctx.shadowColor = color
    ctx.shadowBlur = 4
    ctx.fillText(text, x, y)
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  } else {
    ctx.fillText(text, x, y)
  }
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

  // Modern mode: subtle glow effect on scrolling text
  if (ctx.imageSmoothingEnabled) {
    ctx.shadowColor = color
    ctx.shadowBlur = 4
  }

  ctx.fillText(text, x - offset, y)

  // Second copy for seamless looping
  if (offset > 0) {
    ctx.fillText(text, x - offset + textWidth + gap, y)
  }

  if (ctx.imageSmoothingEnabled) {
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  }

  ctx.restore()
}

export default {
  setupCanvas,
  drawSprite,
  drawBackground,
  drawButton,
  drawSlider,
  drawBitmapText,
  measureText,
  drawScrollingText,
  CBUTTONS_REGIONS
}
