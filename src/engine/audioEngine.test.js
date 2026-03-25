import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path) => `https://asset.localhost${path}`)
}))

// Mock @/utils/constants.js
vi.mock('@/utils/constants.js', () => ({
  DEFAULT_VOLUME: 0.8
}))

// Mock Audio element and AudioContext
function createMockAudio() {
  const listeners = {}
  const audio = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn((event, cb) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(cb)
    }),
    removeEventListener: vi.fn((event, cb) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== cb)
      }
    }),
    _emit: (event, data) => {
      if (listeners[event]) listeners[event].forEach(cb => cb(data))
    },
    currentTime: 0,
    duration: 180,
    paused: true,
    ended: false,
    src: '',
    error: null,
    readyState: 0,
    preload: ''
  }
  // When load() is called, schedule canplay event
  audio.load.mockImplementation(() => {
    audio.readyState = 4
    queueMicrotask(() => audio._emit('canplay'))
  })
  return audio
}

const mockAudioInstances = []
let audioInstanceIndex = 0

function createMockGainNode() {
  return {
    connect: vi.fn(),
    gain: {
      value: 1,
      cancelScheduledValues: vi.fn(),
      setValueCurveAtTime: vi.fn()
    }
  }
}

const mockGainNodes = []
let gainNodeIndex = 0

const mockSourceNode = {
  connect: vi.fn(),
  disconnect: vi.fn()
}

let mockAudioContext

function resetMocks() {
  mockAudioInstances.length = 0
  audioInstanceIndex = 0
  mockGainNodes.length = 0
  gainNodeIndex = 0

  mockAudioContext = {
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => {
      const node = createMockGainNode()
      mockGainNodes.push(node)
      return node
    }),
    createMediaElementSource: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    destination: {},
    currentTime: 0
  }

  vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))
  vi.stubGlobal('Audio', vi.fn(() => {
    const audio = createMockAudio()
    mockAudioInstances.push(audio)
    return audio
  }))
}

let audioEngine

describe('AudioEngine', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    resetMocks()

    // Re-import to get fresh module state
    vi.resetModules()
    const module = await import('./audioEngine.js')
    audioEngine = module.default
  })

  describe('loadAndPlay', () => {
    it('should create AudioContext and audio chain on first call', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      expect(AudioContext).toHaveBeenCalledOnce()
      // masterGainNode + source A gainNode = 2 gain nodes
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2)
      // masterGainNode connects to destination
      expect(mockGainNodes[0].connect).toHaveBeenCalledWith(mockAudioContext.destination)
    })

    it('should initialize masterGainNode at DEFAULT_VOLUME', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(mockGainNodes[0].gain.value).toBe(0.8)
    })

    it('should convert file path via convertFileSrc and set audio src', async () => {
      const { convertFileSrc } = await import('@tauri-apps/api/core')
      await audioEngine.loadAndPlay('/music/test.mp3')

      expect(convertFileSrc).toHaveBeenCalledWith('/music/test.mp3')
      expect(mockAudioInstances[0].src).toBe('https://asset.localhost/music/test.mp3')
    })

    it('should call audio.play()', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(mockAudioInstances[0].play).toHaveBeenCalled()
    })

    it('should create MediaElementAudioSourceNode connected to source GainNode', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mockAudioInstances[0])
    })

    it('should not set crossOrigin on audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(mockAudioInstances[0].crossOrigin).toBeUndefined()
    })

    it('should extract track info from file path', async () => {
      await audioEngine.loadAndPlay('/music/My Song.mp3')
      expect(audioEngine.currentTrackInfo).toEqual({
        path: '/music/My Song.mp3',
        title: 'My Song',
        artist: 'Inconnu',
        duration: 0
      })
    })

    it('should resume suspended AudioContext', async () => {
      mockAudioContext.state = 'suspended'
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('should throw and log error when play fails', async () => {
      const mockAudio = createMockAudio()
      mockAudio.play.mockRejectedValueOnce(new Error('Not allowed'))
      mockAudioInstances.length = 0
      vi.stubGlobal('Audio', vi.fn(() => {
        mockAudioInstances.push(mockAudio)
        return mockAudio
      }))

      vi.resetModules()
      const module = await import('./audioEngine.js')
      const engine = module.default
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(engine.loadAndPlay('/music/test.mp3')).rejects.toThrow('Not allowed')
      expect(consoleSpy).toHaveBeenCalledWith('[AudioEngine] Playback failed:', 'Not allowed')

      consoleSpy.mockRestore()
    })
  })

  describe('pause', () => {
    it('should call audio.pause()', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      audioEngine.pause()
      expect(mockAudioInstances[0].pause).toHaveBeenCalled()
    })
  })

  describe('resume', () => {
    it('should await ensureAudioContext and call audio.play()', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudioInstances[0].play.mockClear()
      mockAudioContext.state = 'suspended'
      await audioEngine.resume()
      expect(mockAudioContext.resume).toHaveBeenCalled()
      expect(mockAudioInstances[0].play).toHaveBeenCalled()
    })

    it('should do nothing when no audio element exists', async () => {
      const result = await audioEngine.resume()
      expect(result).toBeUndefined()
    })
  })

  describe('stop', () => {
    it('should pause and reset currentTime to 0', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudioInstances[0].currentTime = 60
      mockAudioInstances[0].pause.mockClear()

      audioEngine.stop()
      expect(mockAudioInstances[0].pause).toHaveBeenCalled()
      expect(mockAudioInstances[0].currentTime).toBe(0)
    })
  })

  describe('setVolume', () => {
    it('should set masterGainNode value', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      audioEngine.setVolume(0.5)
      expect(mockGainNodes[0].gain.value).toBe(0.5)
    })

    it('should clamp volume to 0-1 range', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      audioEngine.setVolume(1.5)
      expect(mockGainNodes[0].gain.value).toBe(1)

      audioEngine.setVolume(-0.5)
      expect(mockGainNodes[0].gain.value).toBe(0)
    })
  })

  describe('seek', () => {
    it('should set currentTime on audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      audioEngine.seek(42)
      expect(mockAudioInstances[0].currentTime).toBe(42)
    })

    it('should clamp seek to 0-duration range', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      audioEngine.seek(-5)
      expect(mockAudioInstances[0].currentTime).toBe(0)

      audioEngine.seek(999)
      expect(mockAudioInstances[0].currentTime).toBe(180)
    })

    it('should do nothing when no audio element exists', () => {
      audioEngine.seek(10) // Should not throw
    })
  })

  describe('getters', () => {
    it('should return currentTime from audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudioInstances[0].currentTime = 42
      expect(audioEngine.currentTime).toBe(42)
    })

    it('should return duration from audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(audioEngine.duration).toBe(180)
    })

    it('should return isPlaying based on audio state', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudioInstances[0].paused = false
      expect(audioEngine.isPlaying).toBe(true)

      mockAudioInstances[0].paused = true
      expect(audioEngine.isPlaying).toBe(false)
    })

    it('should return 0 for currentTime and duration when no audio', () => {
      expect(audioEngine.currentTime).toBe(0)
      expect(audioEngine.duration).toBe(0)
    })
  })

  describe('events', () => {
    it('should register event listeners on audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      const eventNames = mockAudioInstances[0].addEventListener.mock.calls.map((c) => c[0])
      expect(eventNames).toContain('timeupdate')
      expect(eventNames).toContain('ended')
      expect(eventNames).toContain('error')
      expect(eventNames).toContain('loadedmetadata')
    })
  })

  describe('dual-source architecture', () => {
    it('should create two separate audio elements for sources A and B', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      // Source A created during loadAndPlay
      expect(mockAudioInstances).toHaveLength(1)

      // Preload on inactive source creates source B
      const nextAudio = createMockAudio()
      nextAudio.readyState = 4
      vi.stubGlobal('Audio', vi.fn(() => {
        mockAudioInstances.push(nextAudio)
        return nextAudio
      }))
      await audioEngine.preloadOnInactive('/music/next.mp3')
      expect(mockAudioInstances).toHaveLength(2)
    })

    it('should set active source gain to 1 and inactive to 0', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      // gainNodes[0] = masterGainNode, gainNodes[1] = source A gainNode
      expect(mockGainNodes[1].gain.value).toBe(1)

      // Preload creates source B
      mockAudioInstances[1] = createMockAudio()
      mockAudioInstances[1].readyState = 4
      vi.stubGlobal('Audio', vi.fn(() => mockAudioInstances[1]))
      await audioEngine.preloadOnInactive('/music/next.mp3')
      // gainNodes[2] = source B gainNode
      expect(mockGainNodes[2].gain.value).toBe(0)
    })
  })

  describe('equal-power curves', () => {
    it('should generate correct equal-power crossfade curves', async () => {
      const module = await import('./audioEngine.js')
      const { generateEqualPowerCurves } = module

      const { fadeOut, fadeIn } = generateEqualPowerCurves(5)

      // At t=0: fadeOut=1, fadeIn=0
      expect(fadeOut[0]).toBeCloseTo(1, 5)
      expect(fadeIn[0]).toBeCloseTo(0, 5)

      // At t=1: fadeOut=0, fadeIn=1
      expect(fadeOut[4]).toBeCloseTo(0, 5)
      expect(fadeIn[4]).toBeCloseTo(1, 5)

      // At t=0.5 (midpoint): both should be ~0.707 (equal power)
      expect(fadeOut[2]).toBeCloseTo(Math.cos(0.5 * Math.PI / 2), 5)
      expect(fadeIn[2]).toBeCloseTo(Math.sin(0.5 * Math.PI / 2), 5)

      // Energy conservation: fadeOut² + fadeIn² ≈ 1 at all points
      for (let i = 0; i < 5; i++) {
        const energy = fadeOut[i] ** 2 + fadeIn[i] ** 2
        expect(energy).toBeCloseTo(1, 4)
      }
    })
  })

  describe('preloadOnInactive', () => {
    it('should set src on inactive source', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      // Make the next Audio() call return a mock with readyState >= 3
      const nextAudio = createMockAudio()
      nextAudio.readyState = 4
      vi.stubGlobal('Audio', vi.fn(() => {
        mockAudioInstances.push(nextAudio)
        return nextAudio
      }))

      await audioEngine.preloadOnInactive('/music/next.mp3')
      expect(nextAudio.src).toBe('https://asset.localhost/music/next.mp3')
    })
  })

  describe('crossfade', () => {
    it('should swap sources after crossfade completes', async () => {
      vi.useFakeTimers()
      await audioEngine.loadAndPlay('/music/test.mp3')

      // Preload on inactive
      const nextAudio = createMockAudio()
      nextAudio.readyState = 4
      vi.stubGlobal('Audio', vi.fn(() => {
        mockAudioInstances.push(nextAudio)
        return nextAudio
      }))
      await audioEngine.preloadOnInactive('/music/next.mp3')

      // Start crossfade
      await audioEngine.startCrossfade(3000)
      expect(audioEngine.isCrossfading).toBe(true)

      // Wait for crossfade to complete
      vi.advanceTimersByTime(3000)
      expect(audioEngine.isCrossfading).toBe(false)
      // Active source should have swapped
      expect(audioEngine._activeSource).toBe('b')

      vi.useRealTimers()
    })
  })
})
