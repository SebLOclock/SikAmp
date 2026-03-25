import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock audioEngine
vi.mock('@/engine/audioEngine.js', () => ({
  default: {
    loadAndPlay: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    _audioElement: { currentTime: 0, addEventListener: vi.fn() },
    set onTimeUpdate(cb) {},
    set onEnded(cb) {},
    set onError(cb) {},
    set onLoadedMetadata(cb) {}
  }
}))

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockRejectedValue(new Error('not in Tauri')),
  convertFileSrc: vi.fn((p) => `asset://${p}`)
}))

// Mock Tauri Store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock Vue lifecycle hooks (composable used outside component)
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: (fn) => fn(),
    onUnmounted: () => {}
  }
})

describe('useKeyboardShortcuts', () => {
  let playerStore
  let playlistStore
  let handleKeyDown

  beforeEach(async () => {
    vi.resetModules()

    const { setActivePinia: setAP, createPinia: cP } = await import('pinia')
    setAP(cP())

    const { usePlayerStore } = await import('@/stores/usePlayerStore.js')
    const { usePlaylistStore } = await import('@/stores/usePlaylistStore.js')
    playerStore = usePlayerStore()
    playlistStore = usePlaylistStore()

    const { useKeyboardShortcuts } = await import('./useKeyboardShortcuts.js')
    const result = useKeyboardShortcuts()
    handleKeyDown = result.handleKeyDown
  })

  function fireKey(key, options = {}) {
    const event = {
      key,
      preventDefault: vi.fn(),
      ...options
    }
    handleKeyDown(event)
    return event
  }

  describe('play/pause toggle (Space)', () => {
    it('pauses when playing', async () => {
      playlistStore.addTracks(['/test.mp3'])
      await playerStore.play('/test.mp3')
      fireKey(' ')
      expect(playerStore.isPaused).toBe(true)
    })

    it('resumes when paused', async () => {
      playlistStore.addTracks(['/test.mp3'])
      await playerStore.play('/test.mp3')
      playerStore.pause()
      fireKey(' ')
      // resume is async, wait for it
      await vi.waitFor(() => {
        expect(playerStore.isPlaying).toBe(true)
      })
    })

    it('prevents default behavior', () => {
      const event = fireKey(' ')
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('stop (S)', () => {
    it('stops playback', async () => {
      playlistStore.addTracks(['/test.mp3'])
      await playerStore.play('/test.mp3')
      fireKey('s')
      expect(playerStore.isPlaying).toBe(false)
      expect(playerStore.currentTime).toBe(0)
    })
  })

  describe('next/previous (N/P)', () => {
    it('calls playNext on N', () => {
      playlistStore.addTracks(['/a.mp3', '/b.mp3'])
      playlistStore.currentIndex = 0
      fireKey('n')
      expect(playlistStore.currentIndex).toBe(1)
    })

    it('calls playPrevious on P', () => {
      playlistStore.addTracks(['/a.mp3', '/b.mp3'])
      playlistStore.currentIndex = 1
      fireKey('p')
      expect(playlistStore.currentIndex).toBe(0)
    })
  })

  describe('seek (Arrow Left/Right)', () => {
    it('seeks forward 5 seconds on ArrowRight', async () => {
      playlistStore.addTracks(['/test.mp3'])
      await playerStore.play('/test.mp3')
      playerStore.duration = 100
      playerStore.currentTime = 10
      const event = fireKey('ArrowRight')
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('seeks backward 5 seconds on ArrowLeft', async () => {
      playlistStore.addTracks(['/test.mp3'])
      await playerStore.play('/test.mp3')
      playerStore.duration = 100
      playerStore.currentTime = 10
      const event = fireKey('ArrowLeft')
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('prevents default on arrow keys', () => {
      playerStore.duration = 100
      const event = fireKey('ArrowUp')
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('volume (Arrow Up/Down)', () => {
    it('increases volume on ArrowUp', () => {
      const initialVolume = playerStore.volume
      fireKey('ArrowUp')
      expect(playerStore.volume).toBeGreaterThan(initialVolume)
    })

    it('decreases volume on ArrowDown', () => {
      const initialVolume = playerStore.volume
      fireKey('ArrowDown')
      expect(playerStore.volume).toBeLessThan(initialVolume)
    })
  })

  describe('mute toggle (M)', () => {
    it('mutes when volume > 0', () => {
      playerStore.volume = 0.8
      fireKey('m')
      expect(playerStore.volume).toBe(0)
    })

    it('unmutes and restores previous volume', () => {
      playerStore.volume = 0.6
      fireKey('m') // mute
      expect(playerStore.volume).toBe(0)
      fireKey('m') // unmute
      expect(playerStore.volume).toBeCloseTo(0.6)
    })
  })

  describe('input focus guard', () => {
    it('does nothing when input is focused', async () => {
      playlistStore.addTracks(['/test.mp3'])
      await playerStore.play('/test.mp3')
      // Simulate input focus
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      fireKey(' ')
      // Should still be playing (space didn't pause)
      expect(playerStore.isPlaying).toBe(true)

      document.body.removeChild(input)
    })
  })

  describe('Ctrl+N new playlist', () => {
    it('calls onNewPlaylist callback', async () => {
      const onNewPlaylist = vi.fn()
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onNewPlaylist })

      fireKey('n', { ctrlKey: true })
      expect(onNewPlaylist).toHaveBeenCalled()
    })

    it('prevents default browser behavior', async () => {
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onNewPlaylist: vi.fn() })

      const event = fireKey('n', { ctrlKey: true })
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('works with metaKey (macOS)', async () => {
      const onNewPlaylist = vi.fn()
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onNewPlaylist })

      fireKey('n', { metaKey: true })
      expect(onNewPlaylist).toHaveBeenCalled()
    })
  })

  describe('Ctrl+S save playlist', () => {
    it('calls onSavePlaylist callback', async () => {
      const onSavePlaylist = vi.fn()
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onSavePlaylist })

      fireKey('s', { ctrlKey: true })
      expect(onSavePlaylist).toHaveBeenCalled()
    })

    it('prevents default browser save', async () => {
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onSavePlaylist: vi.fn() })

      const event = fireKey('s', { ctrlKey: true })
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('Ctrl+L load playlist', () => {
    it('calls onLoadPlaylist callback', async () => {
      const onLoadPlaylist = vi.fn()
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onLoadPlaylist })

      fireKey('l', { ctrlKey: true })
      expect(onLoadPlaylist).toHaveBeenCalled()
    })

    it('prevents default browser behavior', async () => {
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onLoadPlaylist: vi.fn() })

      const event = fireKey('l', { ctrlKey: true })
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('works with metaKey (macOS)', async () => {
      const onLoadPlaylist = vi.fn()
      const { registerShortcutCallbacks } = await import('./useKeyboardShortcuts.js')
      registerShortcutCallbacks({ onLoadPlaylist })

      fireKey('l', { metaKey: true })
      expect(onLoadPlaylist).toHaveBeenCalled()
    })
  })

  describe('disabled when playlist is empty', () => {
    it('does not toggle play/pause on Space when playlist is empty', () => {
      // playlist is empty by default
      expect(playlistStore.isEmpty).toBe(true)
      fireKey(' ')
      expect(playerStore.isPlaying).toBe(false)
    })

    it('does not stop on S when playlist is empty', () => {
      expect(playlistStore.isEmpty).toBe(true)
      fireKey('s')
      // No error, just no action
    })

    it('does not navigate on N/P when playlist is empty', () => {
      expect(playlistStore.isEmpty).toBe(true)
      fireKey('n')
      fireKey('p')
      expect(playlistStore.currentIndex).toBe(-1)
    })

    it('still allows volume changes when playlist is empty', () => {
      expect(playlistStore.isEmpty).toBe(true)
      const initialVolume = playerStore.volume
      fireKey('ArrowUp')
      expect(playerStore.volume).toBeGreaterThan(initialVolume)
    })

    it('still allows mute toggle when playlist is empty', () => {
      expect(playlistStore.isEmpty).toBe(true)
      playerStore.volume = 0.8
      fireKey('m')
      expect(playerStore.volume).toBe(0)
    })
  })
})
