import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkinStore, SKIN_COLORS } from './useSkinStore'

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path) => `asset://localhost/${path}`)
}))

describe('useSkinStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSkinStore()
  })

  describe('initial state', () => {
    it('has correct default values', () => {
      expect(store.currentSkin).toBe('Classic Faithful')
      expect(store.isLoaded).toBe(false)
      expect(store.renderMode).toBe('retro')
      expect(store.isCustomSkin).toBe(false)
      expect(store.currentSkinPath).toBeNull()
    })

    it('has assets paths defined', () => {
      expect(store.assets.main).toContain('default-skin/main.bmp')
      expect(store.assets.titlebar).toContain('default-skin/titlebar.bmp')
      expect(store.assets.cbuttons).toContain('default-skin/cbuttons.bmp')
      expect(store.assets.posbar).toContain('default-skin/posbar.bmp')
      expect(store.assets.volume).toContain('default-skin/volume.bmp')
      expect(store.assets.pledit).toContain('default-skin/pledit.bmp')
      expect(store.assets.text).toContain('default-skin/text.bmp')
      expect(store.assets.font).toContain('fonts/display-font.bmp')
    })
  })

  describe('loadDefaultSkin', () => {
    it('marks skin as loaded', () => {
      store.loadDefaultSkin()
      expect(store.isLoaded).toBe(true)
    })

    it('sets current skin to Classic Faithful', () => {
      store.loadDefaultSkin()
      expect(store.currentSkin).toBe('Classic Faithful')
    })

    it('resets custom skin state', () => {
      store.isCustomSkin = true
      store.currentSkinPath = '/some/path.wsz'
      store.loadDefaultSkin()
      expect(store.isCustomSkin).toBe(false)
      expect(store.currentSkinPath).toBeNull()
    })

    it('increments skinVersion', () => {
      const before = store.skinVersion
      store.loadDefaultSkin()
      expect(store.skinVersion).toBe(before + 1)
    })

    it('logs loading messages', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      store.loadDefaultSkin()
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SkinStore]'))
      consoleSpy.mockRestore()
    })
  })

  describe('resetToDefaultSkin', () => {
    it('resets to default skin', () => {
      store.isCustomSkin = true
      store.resetToDefaultSkin()
      expect(store.isCustomSkin).toBe(false)
      expect(store.currentSkin).toBe('Classic Faithful')
    })
  })

  describe('loadSkinFromWsz', () => {
    let originalImage

    beforeEach(() => {
      originalImage = global.Image
    })

    afterEach(() => {
      global.Image = originalImage
    })

    it('calls parse_skin and updates state', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      invoke.mockResolvedValueOnce({
        skinName: 'TestSkin',
        extractDir: '/tmp/sikamp-skins/TestSkin',
        files: ['main.bmp']
      })

      // Mock Image loading (happy-dom doesn't fully support Image)
      global.Image = class {
        set src(_) {
          setTimeout(() => this.onload(), 0)
        }
      }

      await store.loadSkinFromWsz('/path/to/test.wsz')

      expect(invoke).toHaveBeenCalledWith('parse_skin', { wszPath: '/path/to/test.wsz' })
      expect(store.currentSkin).toBe('TestSkin')
      expect(store.currentSkinPath).toBe('/path/to/test.wsz')
      expect(store.isCustomSkin).toBe(true)
      expect(store.isLoaded).toBe(true)
    })

    it('handles parse_skin error', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      invoke.mockRejectedValueOnce(new Error('Invalid archive'))

      await expect(store.loadSkinFromWsz('/bad.wsz')).rejects.toThrow('Invalid archive')
    })
  })

  describe('getAsset', () => {
    it('returns null for uncached assets', () => {
      store.loadDefaultSkin() // clears image cache
      expect(store.getAsset('main')).toBeNull()
      expect(store.getAsset('nonexistent')).toBeNull()
    })
  })

  describe('setRenderMode', () => {
    it('switches to modern mode', () => {
      store.setRenderMode('modern')
      expect(store.renderMode).toBe('modern')
    })

    it('switches to retro mode', () => {
      store.setRenderMode('modern')
      store.setRenderMode('retro')
      expect(store.renderMode).toBe('retro')
    })

    it('rejects invalid modes', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      store.setRenderMode('invalid')
      expect(store.renderMode).toBe('retro')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid render mode'),
        'invalid'
      )
      warnSpy.mockRestore()
    })
  })

  describe('colors getter', () => {
    it('returns default SKIN_COLORS values', () => {
      expect(store.colors).toStrictEqual(SKIN_COLORS)
    })

    it('has all required color keys', () => {
      expect(store.colors.background).toBe('#29292E')
      expect(store.colors.displayBg).toBe('#000000')
      expect(store.colors.textPrimary).toBe('#00FF00')
      expect(store.colors.textSecondary).toBe('#00CC00')
      expect(store.colors.playlistText).toBe('#00FF00')
      expect(store.colors.activeTrack).toBe('#FFFFFF')
      expect(store.colors.playlistBg).toBe('#000000')
    })
  })
})
