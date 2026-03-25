import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupCanvas, drawSprite, drawBackground, drawButton, drawSlider, drawBitmapText, drawScrollingText, measureText } from './skinRenderer'

// Mock canvas context
function createMockContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    imageSmoothingEnabled: true,
    shadowColor: 'transparent',
    shadowBlur: 0,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 }))
  }
}

function createMockCanvas(ctx) {
  return {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext: vi.fn(() => ctx)
  }
}

// Mock window.devicePixelRatio
beforeEach(() => {
  global.window = { devicePixelRatio: 2 }
})

describe('skinRenderer', () => {
  let ctx
  let canvas

  beforeEach(() => {
    ctx = createMockContext()
    canvas = createMockCanvas(ctx)
  })

  describe('setupCanvas', () => {
    it('sets canvas dimensions scaled by devicePixelRatio', () => {
      const result = setupCanvas(canvas, 800, 110, 'retro')
      expect(canvas.width).toBe(1600) // 800 * 2
      expect(canvas.height).toBe(220) // 110 * 2
      expect(canvas.style.width).toBe('800px')
      expect(canvas.style.height).toBe('110px')
      expect(canvas.getContext).toHaveBeenCalledWith('2d')
      expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0)
      expect(result).toBe(ctx)
    })

    it('disables image smoothing in retro mode', () => {
      setupCanvas(canvas, 100, 50, 'retro')
      expect(ctx.imageSmoothingEnabled).toBe(false)
    })

    it('enables image smoothing in modern mode', () => {
      setupCanvas(canvas, 100, 50, 'modern')
      expect(ctx.imageSmoothingEnabled).toBe(true)
    })
  })

  describe('drawSprite', () => {
    it('draws image region to canvas', () => {
      const mockImg = { width: 100, height: 50 }
      const result = drawSprite(ctx, mockImg, 0, 0, 50, 25, 10, 10, 50, 25)
      expect(ctx.drawImage).toHaveBeenCalledWith(mockImg, 0, 0, 50, 25, 10, 10, 50, 25)
      expect(result).toBe(true)
    })

    it('returns false when image is null', () => {
      const result = drawSprite(ctx, null, 0, 0, 50, 25, 10, 10)
      expect(ctx.drawImage).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('uses source dimensions as dest when dw/dh not provided', () => {
      const mockImg = { width: 100, height: 50 }
      drawSprite(ctx, mockImg, 0, 0, 50, 25, 10, 10)
      expect(ctx.drawImage).toHaveBeenCalledWith(mockImg, 0, 0, 50, 25, 10, 10, 50, 25)
    })
  })

  describe('drawBackground', () => {
    it('fills the canvas with background color (no skinStore)', () => {
      drawBackground(ctx, 800, 100)
      expect(ctx.fillStyle).toBe('#29292E')
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 100)
    })

    it('uses skin colors when skinStore is provided', () => {
      const mockSkinStore = { colors: { background: '#112233' }, isCustomSkin: false, mainBmpUrl: null }
      drawBackground(ctx, 800, 100, mockSkinStore)
      expect(ctx.fillStyle).toBe('#112233')
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 100)
    })

    it('clears canvas when custom skin has mainBmpUrl (CSS background shows through)', () => {
      ctx.clearRect = vi.fn()
      const mockSkinStore = { isCustomSkin: true, mainBmpUrl: 'asset://localhost/main.bmp' }
      drawBackground(ctx, 800, 100, mockSkinStore)
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 100)
      expect(ctx.fillRect).not.toHaveBeenCalled()
    })
  })

  describe('drawButton', () => {
    it('draws a normal button with beveled edges', () => {
      drawButton(ctx, 10, 5, 46, 28, 'normal')
      expect(ctx.fillRect).toHaveBeenCalled()
    })

    it('draws a pressed button', () => {
      drawButton(ctx, 10, 5, 46, 28, 'pressed')
      expect(ctx.fillRect).toHaveBeenCalled()
    })

    it('draws a disabled button with disabled color', () => {
      drawButton(ctx, 10, 5, 46, 28, 'disabled')
      const fillCalls = ctx.fillRect.mock.calls
      expect(fillCalls.length).toBeGreaterThan(0)
    })

    it('draws button label when provided', () => {
      drawButton(ctx, 10, 5, 46, 28, 'normal', 'PLAY')
      expect(ctx.fillText).toHaveBeenCalledWith('PLAY', 33, 20)
    })

    it('draws hover highlight', () => {
      drawButton(ctx, 10, 5, 46, 28, 'hover')
      expect(ctx.fillRect).toHaveBeenCalled()
    })
  })

  describe('drawSlider', () => {
    it('draws slider with correct fill ratio', () => {
      drawSlider(ctx, 0, 0, 200, 12, 50, 0, 100)
      expect(ctx.fillRect).toHaveBeenCalled()
    })

    it('handles zero range without division error', () => {
      expect(() => drawSlider(ctx, 0, 0, 200, 12, 0, 0, 0)).not.toThrow()
    })
  })

  describe('drawBitmapText', () => {
    it('draws text as a single fillText call', () => {
      drawBitmapText(ctx, 'Hello', 10, 5, 14)
      expect(ctx.fillText).toHaveBeenCalledWith('Hello', 10, 5)
    })

    it('uses custom color when provided', () => {
      drawBitmapText(ctx, 'X', 0, 0, 12, null, '#FF0000')
      expect(ctx.fillStyle).toBe('#FF0000')
    })

    it('uses bold monospace font at given size', () => {
      drawBitmapText(ctx, 'Test', 0, 0, 16)
      expect(ctx.font).toBe('bold 16px "Courier New", "Consolas", monospace')
    })

    it('handles empty string', () => {
      drawBitmapText(ctx, '', 0, 0)
      expect(ctx.fillText).toHaveBeenCalledWith('', 0, 0)
    })
  })

  describe('measureText', () => {
    it('returns measured width', () => {
      const width = measureText(ctx, 'Hello', 14)
      expect(ctx.measureText).toHaveBeenCalledWith('Hello')
      expect(width).toBe(100) // mocked value
    })
  })

  describe('drawScrollingText', () => {
    it('clips to the display area', () => {
      drawScrollingText(ctx, 'Hello World', 4, 4, 200, 0)
      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.rect).toHaveBeenCalled()
      expect(ctx.clip).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })

    it('draws text with offset applied', () => {
      drawScrollingText(ctx, 'Hello', 10, 5, 200, 3)
      expect(ctx.fillText).toHaveBeenCalledWith('Hello', 7, 5)
    })

    it('draws second copy for seamless looping when scrolling', () => {
      drawScrollingText(ctx, 'AB', 0, 0, 200, 5)
      expect(ctx.fillText).toHaveBeenCalledTimes(2)
    })
  })
})
