import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkinStore, SKIN_COLORS } from './useSkinStore'

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

    it('logs loading messages', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      store.loadDefaultSkin()
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SkinStore]'))
      consoleSpy.mockRestore()
    })
  })

  describe('getAsset', () => {
    it('returns null for uncached assets', () => {
      expect(store.getAsset('main')).toBeNull()
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
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid render mode'), 'invalid')
      warnSpy.mockRestore()
    })
  })

  describe('colors getter', () => {
    it('returns SKIN_COLORS', () => {
      expect(store.colors).toBe(SKIN_COLORS)
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
