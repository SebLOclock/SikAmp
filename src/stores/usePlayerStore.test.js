import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock audioEngine
vi.mock('@/engine/audioEngine.js', () => ({
  default: {
    loadAndPlay: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
    currentTrackInfo: null,
    currentTime: 0,
    _audioElement: { currentTime: 0 },
    set onTimeUpdate(cb) { this._onTimeUpdate = cb },
    set onEnded(cb) { this._onEnded = cb },
    set onLoadedMetadata(cb) { this._onLoadedMetadata = cb },
    set onError(cb) { this._onError = cb },
    _onTimeUpdate: null,
    _onEnded: null,
    _onLoadedMetadata: null,
    _onError: null
  }
}))

let audioEngine

describe('usePlayerStore', () => {
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())

    const mod = await import('@/engine/audioEngine.js')
    audioEngine = mod.default
    vi.clearAllMocks()
    audioEngine.loadAndPlay.mockResolvedValue(undefined)
    audioEngine.resume.mockResolvedValue(undefined)
    audioEngine._onTimeUpdate = null
    audioEngine._onEnded = null
    audioEngine._onLoadedMetadata = null
    audioEngine._onError = null

    // Reset eventsSubscribed by reimporting the store module
    vi.resetModules()
    // Re-setup mocks after resetModules
    const { setActivePinia: setAP, createPinia: cP } = await import('pinia')
    setAP(cP())
    const { usePlayerStore } = await import('./usePlayerStore.js')
    store = usePlayerStore()

    // Re-get audioEngine ref after resetModules
    const mod2 = await import('@/engine/audioEngine.js')
    audioEngine = mod2.default
    audioEngine.loadAndPlay.mockResolvedValue(undefined)
    audioEngine.resume.mockResolvedValue(undefined)
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.isPlaying).toBe(false)
      expect(store.isPaused).toBe(false)
      expect(store.currentTrack).toBeNull()
      expect(store.currentTime).toBe(0)
      expect(store.duration).toBe(0)
      expect(store.volume).toBe(0.8)
    })
  })

  describe('getters', () => {
    it('isStopped should be true when not playing and not paused', () => {
      expect(store.isStopped).toBe(true)
    })

    it('isStopped should be false when playing', async () => {
      await store.play('/music/test.mp3')
      expect(store.isStopped).toBe(false)
    })

    it('formattedCurrentTime should format seconds as m:ss', () => {
      store.currentTime = 125
      expect(store.formattedCurrentTime).toBe('2:05')
    })

    it('formattedDuration should format seconds as m:ss', () => {
      store.duration = 300
      expect(store.formattedDuration).toBe('5:00')
    })

    it('formattedCurrentTime should return 0:00 for zero', () => {
      expect(store.formattedCurrentTime).toBe('0:00')
    })

    it('progressPercent should calculate percentage', () => {
      store.currentTime = 30
      store.duration = 120
      expect(store.progressPercent).toBe(25)
    })

    it('progressPercent should return 0 when duration is 0', () => {
      expect(store.progressPercent).toBe(0)
    })
  })

  describe('actions', () => {
    describe('play', () => {
      it('should subscribe to events before calling loadAndPlay', async () => {
        await store.play('/music/test.mp3')

        // Events should be subscribed (callbacks set)
        expect(audioEngine._onTimeUpdate).toBeTypeOf('function')
        expect(audioEngine.loadAndPlay).toHaveBeenCalledWith('/music/test.mp3')
        expect(store.isPlaying).toBe(true)
        expect(store.isPaused).toBe(false)
      })

      it('should set isPlaying to false on error', async () => {
        audioEngine.loadAndPlay.mockRejectedValueOnce(new Error('fail'))
        vi.spyOn(console, 'error').mockImplementation(() => {})

        await store.play('/music/bad.mp3')

        expect(store.isPlaying).toBe(false)
        expect(store.isPaused).toBe(false)
      })
    })

    describe('pause', () => {
      it('should call audioEngine.pause and update state', async () => {
        await store.play('/music/test.mp3')
        store.pause()

        expect(audioEngine.pause).toHaveBeenCalled()
        expect(store.isPlaying).toBe(false)
        expect(store.isPaused).toBe(true)
      })
    })

    describe('resume', () => {
      it('should call audioEngine.resume and update state', async () => {
        await store.play('/music/test.mp3')
        store.pause()
        await store.resume()

        expect(audioEngine.resume).toHaveBeenCalled()
        expect(store.isPlaying).toBe(true)
        expect(store.isPaused).toBe(false)
      })

      it('should not set isPlaying when no audio element', async () => {
        audioEngine._audioElement = null
        await store.resume()
        expect(store.isPlaying).toBe(false)
        // Restore for other tests
        audioEngine._audioElement = { currentTime: 0 }
      })
    })

    describe('stop', () => {
      it('should call audioEngine.stop and reset state', async () => {
        await store.play('/music/test.mp3')
        store.stop()

        expect(audioEngine.stop).toHaveBeenCalled()
        expect(store.isPlaying).toBe(false)
        expect(store.isPaused).toBe(false)
        expect(store.currentTime).toBe(0)
      })
    })

    describe('setVolume', () => {
      it('should update volume and call audioEngine.setVolume', () => {
        store.setVolume(0.5)

        expect(store.volume).toBe(0.5)
        expect(audioEngine.setVolume).toHaveBeenCalledWith(0.5)
      })

      it('should clamp volume to 0-1', () => {
        store.setVolume(1.5)
        expect(store.volume).toBe(1)

        store.setVolume(-0.3)
        expect(store.volume).toBe(0)
      })
    })

    describe('seek', () => {
      it('should call audioEngine.seek with the time', async () => {
        await store.play('/music/test.mp3')
        store.seek(42)
        expect(audioEngine.seek).toHaveBeenCalledWith(42)
      })
    })
  })

  describe('event subscriptions', () => {
    it('should subscribe to audioEngine events on play', async () => {
      await store.play('/music/test.mp3')

      expect(audioEngine._onTimeUpdate).toBeTypeOf('function')
      expect(audioEngine._onEnded).toBeTypeOf('function')
      expect(audioEngine._onLoadedMetadata).toBeTypeOf('function')
      expect(audioEngine._onError).toBeTypeOf('function')
    })

    it('onTimeUpdate should update currentTime', async () => {
      await store.play('/music/test.mp3')
      audioEngine._onTimeUpdate(55.5)
      expect(store.currentTime).toBe(55.5)
    })

    it('onEnded should reset state', async () => {
      await store.play('/music/test.mp3')
      audioEngine._onEnded()

      expect(store.isPlaying).toBe(false)
      expect(store.isPaused).toBe(false)
      expect(store.currentTime).toBe(0)
    })

    it('onLoadedMetadata should update duration and track', async () => {
      await store.play('/music/test.mp3')
      audioEngine._onLoadedMetadata({
        duration: 240,
        trackInfo: { path: '/music/test.mp3', title: 'test', artist: 'Unknown', duration: 240 }
      })

      expect(store.duration).toBe(240)
      expect(store.currentTrack).toEqual({
        path: '/music/test.mp3',
        title: 'test',
        artist: 'Unknown',
        duration: 240
      })
    })

    it('onError should reset playing state', async () => {
      await store.play('/music/test.mp3')
      audioEngine._onError(new Error('decode error'))

      expect(store.isPlaying).toBe(false)
      expect(store.isPaused).toBe(false)
    })

    it('should apply volume on first play', async () => {
      store.volume = 0.6
      await store.play('/music/test.mp3')
      expect(audioEngine.setVolume).toHaveBeenCalledWith(0.6)
    })
  })
})
