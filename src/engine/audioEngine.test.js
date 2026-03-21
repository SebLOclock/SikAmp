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
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  currentTime: 0,
  duration: 180,
  paused: true,
  ended: false,
  src: '',
  error: null
}

const mockGainNode = {
  connect: vi.fn(),
  gain: { value: 1 }
}

const mockSourceNode = {
  connect: vi.fn(),
  disconnect: vi.fn()
}

const mockAudioContext = {
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  createGain: vi.fn(() => mockGainNode),
  createMediaElementSource: vi.fn(() => mockSourceNode),
  destination: {}
}

vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))
vi.stubGlobal('Audio', vi.fn(() => mockAudio))

let audioEngine

describe('AudioEngine', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockAudio.paused = true
    mockAudio.ended = false
    mockAudio.currentTime = 0
    mockAudio.duration = 180
    mockAudio.src = ''
    mockAudioContext.state = 'running'
    mockGainNode.gain.value = 1

    // Re-import to get fresh module state
    vi.resetModules()
    const module = await import('./audioEngine.js')
    audioEngine = module.default
  })

  describe('loadAndPlay', () => {
    it('should create AudioContext and audio chain on first call', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      expect(AudioContext).toHaveBeenCalledOnce()
      expect(mockAudioContext.createGain).toHaveBeenCalledOnce()
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination)
    })

    it('should initialize GainNode at DEFAULT_VOLUME', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      // GainNode gain.value is set to DEFAULT_VOLUME (0.8) at creation
      expect(mockGainNode.gain.value).toBe(0.8)
    })

    it('should convert file path via convertFileSrc and set audio src', async () => {
      const { convertFileSrc } = await import('@tauri-apps/api/core')
      await audioEngine.loadAndPlay('/music/test.mp3')

      expect(convertFileSrc).toHaveBeenCalledWith('/music/test.mp3')
      expect(mockAudio.src).toBe('https://asset.localhost/music/test.mp3')
    })

    it('should call audio.play()', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(mockAudio.play).toHaveBeenCalled()
    })

    it('should create MediaElementAudioSourceNode connected to GainNode', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      expect(mockAudioContext.createMediaElementSource).toHaveBeenCalledWith(mockAudio)
      expect(mockSourceNode.connect).toHaveBeenCalledWith(mockGainNode)
    })

    it('should not set crossOrigin on audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(mockAudio.crossOrigin).toBeUndefined()
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
      mockAudio.play.mockRejectedValueOnce(new Error('Not allowed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(audioEngine.loadAndPlay('/music/test.mp3')).rejects.toThrow('Not allowed')
      expect(consoleSpy).toHaveBeenCalledWith('[AudioEngine] Playback failed:', 'Not allowed')

      consoleSpy.mockRestore()
    })
  })

  describe('pause', () => {
    it('should call audio.pause()', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      audioEngine.pause()
      expect(mockAudio.pause).toHaveBeenCalled()
    })
  })

  describe('resume', () => {
    it('should await ensureAudioContext and call audio.play()', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudio.play.mockClear()
      mockAudioContext.state = 'suspended'
      await audioEngine.resume()
      expect(mockAudioContext.resume).toHaveBeenCalled()
      expect(mockAudio.play).toHaveBeenCalled()
    })

    it('should do nothing when no audio element exists', async () => {
      const result = await audioEngine.resume()
      expect(result).toBeUndefined()
      expect(mockAudio.play).not.toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should pause and reset currentTime to 0', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudio.currentTime = 60
      mockAudio.pause.mockClear()

      audioEngine.stop()
      expect(mockAudio.pause).toHaveBeenCalled()
      expect(mockAudio.currentTime).toBe(0)
    })
  })

  describe('setVolume', () => {
    it('should set gainNode value', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      audioEngine.setVolume(0.5)
      expect(mockGainNode.gain.value).toBe(0.5)
    })

    it('should clamp volume to 0-1 range', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      audioEngine.setVolume(1.5)
      expect(mockGainNode.gain.value).toBe(1)

      audioEngine.setVolume(-0.5)
      expect(mockGainNode.gain.value).toBe(0)
    })
  })

  describe('seek', () => {
    it('should set currentTime on audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      audioEngine.seek(42)
      expect(mockAudio.currentTime).toBe(42)
    })

    it('should clamp seek to 0-duration range', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')

      audioEngine.seek(-5)
      expect(mockAudio.currentTime).toBe(0)

      audioEngine.seek(999)
      expect(mockAudio.currentTime).toBe(180)
    })

    it('should do nothing when no audio element exists', () => {
      audioEngine.seek(10) // Should not throw
    })
  })

  describe('getters', () => {
    it('should return currentTime from audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudio.currentTime = 42
      expect(audioEngine.currentTime).toBe(42)
    })

    it('should return duration from audio element', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      expect(audioEngine.duration).toBe(180)
    })

    it('should return isPlaying based on audio state', async () => {
      await audioEngine.loadAndPlay('/music/test.mp3')
      mockAudio.paused = false
      expect(audioEngine.isPlaying).toBe(true)

      mockAudio.paused = true
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
      const eventNames = mockAudio.addEventListener.mock.calls.map((c) => c[0])
      expect(eventNames).toContain('timeupdate')
      expect(eventNames).toContain('ended')
      expect(eventNames).toContain('error')
      expect(eventNames).toContain('loadedmetadata')
    })
  })
})
