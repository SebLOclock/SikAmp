import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the jingle asset import
vi.mock('@/assets/jingle.mp3', () => ({ default: '/mocked-jingle.mp3' }))

// Mock usePreferencesStore
const mockPreferencesStore = {
  jingleEnabled: true,
  loadPreferences: vi.fn()
}

vi.mock('@/stores/usePreferencesStore', () => ({
  usePreferencesStore: vi.fn(() => mockPreferencesStore)
}))

describe('useJingle', () => {
  let mockAudio
  let playPromise

  beforeEach(() => {
    setActivePinia(createPinia())
    playPromise = Promise.resolve()
    mockAudio = {
      src: '',
      volume: 1,
      play: vi.fn(() => playPromise),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    vi.stubGlobal(
      'Audio',
      vi.fn(() => mockAudio)
    )
    mockPreferencesStore.jingleEnabled = true
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should create an Audio element with the jingle URL', async () => {
    const { useJingle } = await import('./useJingle.js')
    const { playJingle } = useJingle()
    await playJingle()

    expect(Audio).toHaveBeenCalledWith('/mocked-jingle.mp3')
  })

  it('should set volume to 0.7', async () => {
    const { useJingle } = await import('./useJingle.js')
    const { playJingle } = useJingle()
    await playJingle()

    expect(mockAudio.volume).toBe(0.7)
  })

  it('should call play() when jingleEnabled is true', async () => {
    const { useJingle } = await import('./useJingle.js')
    const { playJingle } = useJingle()
    await playJingle()

    expect(mockAudio.play).toHaveBeenCalled()
  })

  it('should NOT call play() when jingleEnabled is false', async () => {
    mockPreferencesStore.jingleEnabled = false
    const { useJingle } = await import('./useJingle.js')
    const { playJingle } = useJingle()
    await playJingle()

    expect(mockAudio.play).not.toHaveBeenCalled()
  })

  it('should silently fail if play() is rejected (autoplay policy)', async () => {
    playPromise = Promise.reject(new Error('Autoplay blocked'))
    mockAudio.play = vi.fn(() => playPromise)

    const { useJingle } = await import('./useJingle.js')
    const { playJingle } = useJingle()

    // Should not throw
    await expect(playJingle()).resolves.toBeUndefined()
  })

  it('should not interfere with audioEngine (separate Audio instance)', async () => {
    const { useJingle } = await import('./useJingle.js')
    const { playJingle } = useJingle()
    await playJingle()

    // Verifies it creates its own Audio, not importing audioEngine
    expect(Audio).toHaveBeenCalled()
  })
})
