import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Tauri dependencies
const mockTauriStore = {
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn()
}

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(() => Promise.resolve(mockTauriStore))
}))

vi.mock('@/assets/jingle.mp3', () => ({ default: '/mocked-jingle.mp3' }))

describe('Jingle integration', () => {
  let mockAudio

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockTauriStore.get.mockResolvedValue(null)

    mockAudio = {
      src: '',
      volume: 1,
      play: vi.fn(() => Promise.resolve()),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    vi.stubGlobal(
      'Audio',
      vi.fn(() => mockAudio)
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should play jingle at startup when preference is active (default)', async () => {
    const { usePreferencesStore } = await import('@/stores/usePreferencesStore')
    const { useJingle } = await import('./useJingle.js')

    const prefs = usePreferencesStore()
    await prefs.loadPreferences()

    const { playJingle } = useJingle()
    await playJingle()

    expect(prefs.jingleEnabled).toBe(true)
    expect(mockAudio.play).toHaveBeenCalled()
  })

  it('should NOT play jingle when preference is inactive', async () => {
    mockTauriStore.get.mockImplementation((key) => {
      if (key === 'jingleEnabled') return Promise.resolve(false)
      return Promise.resolve(null)
    })

    const { usePreferencesStore } = await import('@/stores/usePreferencesStore')
    const { useJingle } = await import('./useJingle.js')

    const prefs = usePreferencesStore()
    await prefs.loadPreferences()

    expect(prefs.jingleEnabled).toBe(false)

    const { playJingle } = useJingle()
    await playJingle()

    expect(mockAudio.play).not.toHaveBeenCalled()
  })

  it('should persist toggle preference between reloads', async () => {
    vi.useFakeTimers()
    const { usePreferencesStore } = await import('@/stores/usePreferencesStore')

    const prefs = usePreferencesStore()
    await prefs.loadPreferences()

    // Toggle off
    prefs.toggleJingle()
    expect(prefs.jingleEnabled).toBe(false)

    // Wait for debounce
    await vi.advanceTimersByTimeAsync(600)

    expect(mockTauriStore.set).toHaveBeenCalledWith('jingleEnabled', false)
    expect(mockTauriStore.save).toHaveBeenCalled()

    // Toggle back on
    prefs.toggleJingle()
    expect(prefs.jingleEnabled).toBe(true)

    await vi.advanceTimersByTimeAsync(600)

    expect(mockTauriStore.set).toHaveBeenCalledWith('jingleEnabled', true)

    vi.useRealTimers()
  })

  it('should not block interface loading if jingle fails', async () => {
    mockAudio.play = vi.fn(() => Promise.reject(new Error('Autoplay blocked')))

    const { usePreferencesStore } = await import('@/stores/usePreferencesStore')
    const { useJingle } = await import('./useJingle.js')

    const prefs = usePreferencesStore()
    await prefs.loadPreferences()

    const { playJingle } = useJingle()

    // playJingle should resolve without throwing
    const startTime = Date.now()
    await playJingle()
    const elapsed = Date.now() - startTime

    // Should complete quickly (not block)
    expect(elapsed).toBeLessThan(100)
  })
})
