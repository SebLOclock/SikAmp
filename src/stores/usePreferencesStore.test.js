import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn()
}

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(() => Promise.resolve(mockStore))
}))

describe('usePreferencesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.get.mockResolvedValue(null)
  })

  it('should have jingleEnabled default to true', async () => {
    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()
    expect(store.jingleEnabled).toBe(true)
  })

  it('should toggle jingleEnabled on/off', async () => {
    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()

    expect(store.jingleEnabled).toBe(true)
    store.toggleJingle()
    expect(store.jingleEnabled).toBe(false)
    store.toggleJingle()
    expect(store.jingleEnabled).toBe(true)
  })

  it('should load jingleEnabled from Tauri store', async () => {
    mockStore.get.mockImplementation((key) => {
      if (key === 'jingleEnabled') return Promise.resolve(false)
      return Promise.resolve(null)
    })

    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()
    await store.loadPreferences()

    expect(store.jingleEnabled).toBe(false)
  })

  it('should persist jingleEnabled when toggled', async () => {
    vi.useFakeTimers()
    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()

    store.toggleJingle()

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(600)

    expect(mockStore.set).toHaveBeenCalledWith('jingleEnabled', false)
    expect(mockStore.save).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('should keep jingleEnabled true when not saved in store', async () => {
    mockStore.get.mockResolvedValue(null)

    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()
    await store.loadPreferences()

    expect(store.jingleEnabled).toBe(true)
  })

  describe('renderMode', () => {
    it('should default to retro', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      expect(store.renderMode).toBe('retro')
    })

    it('should set render mode to modern', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      store.setRenderMode('modern')
      expect(store.renderMode).toBe('modern')
    })

    it('should reject invalid render mode', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      store.setRenderMode('invalid')
      expect(store.renderMode).toBe('retro')
    })

    it('should persist renderMode', async () => {
      vi.useFakeTimers()
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()

      store.setRenderMode('modern')
      await vi.advanceTimersByTimeAsync(600)

      expect(mockStore.set).toHaveBeenCalledWith('renderMode', 'modern')
      expect(mockStore.save).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should load renderMode from Tauri store', async () => {
      mockStore.get.mockImplementation((key) => {
        if (key === 'renderMode') return Promise.resolve('modern')
        return Promise.resolve(null)
      })

      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      await store.loadPreferences()

      expect(store.renderMode).toBe('modern')
    })
  })

  describe('windowState', () => {
    it('should default to null', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      expect(store.windowState).toBeNull()
    })

    it('should save window state (debounced)', async () => {
      vi.useFakeTimers()
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()

      const state = { width: 900, height: 500, x: 100, y: 200 }
      store.saveWindowState(state)
      await vi.advanceTimersByTimeAsync(600)

      expect(store.windowState).toEqual(state)
      expect(mockStore.set).toHaveBeenCalledWith('windowState', state)
      expect(mockStore.save).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should load windowState from Tauri store', async () => {
      const savedState = { width: 1024, height: 600, x: 50, y: 50 }
      mockStore.get.mockImplementation((key) => {
        if (key === 'windowState') return Promise.resolve(savedState)
        return Promise.resolve(null)
      })

      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      await store.loadPreferences()

      expect(store.windowState).toEqual(savedState)
    })
  })

  describe('crossfade', () => {
    it('should default crossfadeEnabled to true', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      expect(store.crossfadeEnabled).toBe(true)
    })

    it('should default crossfadeDuration to 5', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      expect(store.crossfadeDuration).toBe(5)
    })

    it('should set crossfadeEnabled', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      store.setCrossfadeEnabled(false)
      expect(store.crossfadeEnabled).toBe(false)
      store.setCrossfadeEnabled(true)
      expect(store.crossfadeEnabled).toBe(true)
    })

    it('should persist crossfadeEnabled', async () => {
      vi.useFakeTimers()
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()

      store.setCrossfadeEnabled(false)
      await vi.advanceTimersByTimeAsync(600)

      expect(mockStore.set).toHaveBeenCalledWith('crossfadeEnabled', false)
      expect(mockStore.save).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should set crossfadeDuration and clamp to 1-12', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()

      store.setCrossfadeDuration(8)
      expect(store.crossfadeDuration).toBe(8)

      store.setCrossfadeDuration(0)
      expect(store.crossfadeDuration).toBe(1)

      store.setCrossfadeDuration(20)
      expect(store.crossfadeDuration).toBe(12)
    })

    it('should persist crossfadeDuration', async () => {
      vi.useFakeTimers()
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()

      store.setCrossfadeDuration(8)
      await vi.advanceTimersByTimeAsync(600)

      expect(mockStore.set).toHaveBeenCalledWith('crossfadeDuration', 8)
      expect(mockStore.save).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should load crossfadeEnabled from Tauri store', async () => {
      mockStore.get.mockImplementation((key) => {
        if (key === 'crossfadeEnabled') return Promise.resolve(false)
        return Promise.resolve(null)
      })

      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      await store.loadPreferences()

      expect(store.crossfadeEnabled).toBe(false)
    })

    it('should load crossfadeDuration from Tauri store', async () => {
      mockStore.get.mockImplementation((key) => {
        if (key === 'crossfadeDuration') return Promise.resolve(8)
        return Promise.resolve(null)
      })

      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      await store.loadPreferences()

      expect(store.crossfadeDuration).toBe(8)
    })

    it('should reject invalid crossfadeDuration from Tauri store', async () => {
      mockStore.get.mockImplementation((key) => {
        if (key === 'crossfadeDuration') return Promise.resolve(99)
        return Promise.resolve(null)
      })

      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      await store.loadPreferences()

      expect(store.crossfadeDuration).toBe(5) // Default
    })
  })

  describe('scaleFactor', () => {
    it('should default to null', async () => {
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()
      expect(store.scaleFactor).toBeNull()
    })

    it('should set and persist scale factor', async () => {
      vi.useFakeTimers()
      const { usePreferencesStore } = await import('./usePreferencesStore.js')
      const store = usePreferencesStore()

      store.setScaleFactor(2)
      expect(store.scaleFactor).toBe(2)

      await vi.advanceTimersByTimeAsync(600)
      expect(mockStore.set).toHaveBeenCalledWith('scaleFactor', 2)
      vi.useRealTimers()
    })
  })
})
