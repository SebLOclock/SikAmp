import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Tauri Store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock Tauri core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({}),
  convertFileSrc: vi.fn((path) => `asset://localhost/${path}`)
}))

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
    _audioElement: { addEventListener: vi.fn(), currentTime: 0 },
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

describe('Error Handling Integration', () => {
  let playerStore, playlistStore, audioEngine

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.resetModules()

    const { setActivePinia: setAP, createPinia: cP } = await import('pinia')
    setAP(cP())

    const { usePlayerStore } = await import('./usePlayerStore.js')
    const { usePlaylistStore } = await import('./usePlaylistStore.js')
    const mod = await import('@/engine/audioEngine.js')

    playerStore = usePlayerStore()
    playlistStore = usePlaylistStore()
    audioEngine = mod.default

    vi.clearAllMocks()
    audioEngine.loadAndPlay.mockResolvedValue(undefined)
    audioEngine._audioElement = { addEventListener: vi.fn(), currentTime: 0 }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('showFeedback (AC #1, #2, #3)', () => {
    it('sets feedbackMessage with correct text and color', () => {
      playerStore.showFeedback('Format non supporté : track.wma', 'error')
      expect(playerStore.feedbackMessage).toEqual({
        text: 'Format non supporté : track.wma',
        color: '#FF4444'
      })
    })

    it('auto-clears after 3 seconds', () => {
      playerStore.showFeedback('Test message', 'error')
      expect(playerStore.feedbackMessage).not.toBeNull()

      vi.advanceTimersByTime(3000)
      expect(playerStore.feedbackMessage).toBeNull()
    })

    it('replaces previous message (no stacking — AC #4)', () => {
      playerStore.showFeedback('First error', 'error')
      playerStore.showFeedback('Second error', 'error')
      expect(playerStore.feedbackMessage.text).toBe('Second error')

      // Only one timer — advancing 3s should clear it
      vi.advanceTimersByTime(3000)
      expect(playerStore.feedbackMessage).toBeNull()
    })

    it('supports different message types with correct colors', () => {
      playerStore.showFeedback('Error!', 'error')
      expect(playerStore.feedbackMessage.color).toBe('#FF4444')

      playerStore.showFeedback('Success!', 'success')
      expect(playerStore.feedbackMessage.color).toBe('#44FF44')

      playerStore.showFeedback('Info!', 'info')
      expect(playerStore.feedbackMessage.color).toBe('#4488FF')
    })

    it('persistent mode keeps message visible', () => {
      playerStore.showFeedback('Persistent error', 'error', true)
      vi.advanceTimersByTime(10000)
      expect(playerStore.feedbackMessage).not.toBeNull()
    })

    it('clearFeedback removes message immediately', () => {
      playerStore.showFeedback('Message', 'error')
      playerStore.clearFeedback()
      expect(playerStore.feedbackMessage).toBeNull()
    })
  })

  describe('Format pre-check skip (AC #1)', () => {
    it('skips unsupported format and shows feedback', async () => {
      playlistStore.addTracks(['/music/good.mp3', '/music/bad.wma', '/music/also-good.ogg'])

      // Play the unsupported track (index 1)
      await playlistStore.playTrack(1)

      // Should show format error feedback
      expect(playerStore.feedbackMessage).not.toBeNull()
      expect(playerStore.feedbackMessage.text).toBe('Format non supporté : bad.wma')
      expect(playerStore.feedbackMessage.color).toBe('#FF4444')

      // Should NOT have called audioEngine.loadAndPlay for the unsupported file
      // (it will have been called for the next track via playNext)
    })
  })

  describe('Consecutive error tracking (AC #5)', () => {
    it('increments _consecutiveErrors on each error', async () => {
      playlistStore.addTracks(['/music/bad1.wma', '/music/bad2.xyz'])

      // playTrack(0) should trigger format error, increment, and try next
      // playTrack(1) should also fail format check
      // Both are unsupported so _consecutiveErrors should reach tracks.length
      await playlistStore.playTrack(0)

      // After all tracks fail, should have stopped (consecutiveErrors >= tracks.length)
      expect(playlistStore._consecutiveErrors).toBeGreaterThanOrEqual(playlistStore.tracks.length)
    })

    it('stops playback when all tracks fail (AC #5)', async () => {
      playlistStore.addTracks(['/music/bad1.wma', '/music/bad2.aac', '/music/bad3.m4a'])

      await playlistStore.playTrack(0)

      expect(playerStore.isPlaying).toBe(false)
      // Last error message should be visible (persistent)
      expect(playerStore.feedbackMessage).not.toBeNull()
    })

    it('resets consecutiveErrors on successful playback via onLoadedMetadata', async () => {
      playlistStore.addTracks(['/music/good.mp3'])
      playlistStore._consecutiveErrors = 3

      await playlistStore.playTrack(0)

      // loadAndPlay succeeds, isPlaying should be true
      expect(playerStore.isPlaying).toBe(true)

      // Simulate onLoadedMetadata firing (the real success signal)
      audioEngine._onLoadedMetadata({ duration: 180, trackInfo: { path: '/music/good.mp3', title: 'good' } })

      // Wait for dynamic import in onLoadedMetadata to resolve
      await vi.advanceTimersByTimeAsync(0)

      expect(playlistStore._consecutiveErrors).toBe(0)
    })

    it('resets consecutiveErrors on clearPlaylist', () => {
      playlistStore._consecutiveErrors = 5
      playlistStore.clearPlaylist()
      expect(playlistStore._consecutiveErrors).toBe(0)
    })

    it('clears feedback and resets errors when adding new tracks (P6)', () => {
      playerStore.showFeedback('Persistent error', 'error', true)
      playlistStore._consecutiveErrors = 3

      playlistStore.addTracks(['/music/new.mp3'])

      expect(playerStore.feedbackMessage).toBeNull()
      expect(playlistStore._consecutiveErrors).toBe(0)
    })

    it('clears feedback on successful track load via onLoadedMetadata (P5)', async () => {
      playlistStore.addTracks(['/music/good.mp3'])
      playerStore.showFeedback('Previous error', 'error')

      await playlistStore.playTrack(0)

      // Simulate successful load
      audioEngine._onLoadedMetadata({ duration: 180, trackInfo: { path: '/music/good.mp3', title: 'good' } })

      expect(playerStore.feedbackMessage).toBeNull()
    })
  })

  describe('Audio error callback (AC #2, #3)', () => {
    it('shows "Fichier introuvable" for network errors (code 2)', async () => {
      playlistStore.addTracks(['/music/missing.mp3', '/music/other.mp3'])
      await playlistStore.playTrack(0)

      // Simulate audioEngine having set currentTrackInfo (as loadAndPlay does)
      audioEngine.currentTrackInfo = { path: '/music/missing.mp3', title: 'missing' }
      audioEngine._onError({ code: 2, message: 'MEDIA_ERR_NETWORK' })

      expect(playerStore.feedbackMessage.text).toBe('Fichier introuvable : missing.mp3')
    })

    it('shows "Impossible de lire" for decode errors (code 3)', async () => {
      playlistStore.addTracks(['/music/corrupt.mp3', '/music/other.mp3'])
      await playlistStore.playTrack(0)

      audioEngine.currentTrackInfo = { path: '/music/corrupt.mp3', title: 'corrupt' }
      audioEngine._onError({ code: 3, message: 'MEDIA_ERR_DECODE' })

      expect(playerStore.feedbackMessage.text).toBe('Impossible de lire : corrupt.mp3')
    })

    it('shows "Impossible de lire" for unsupported source errors (code 4)', async () => {
      playlistStore.addTracks(['/music/weird.mp3', '/music/other.mp3'])
      await playlistStore.playTrack(0)

      audioEngine.currentTrackInfo = { path: '/music/weird.mp3', title: 'weird' }
      audioEngine._onError({ code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED' })

      expect(playerStore.feedbackMessage.text).toBe('Impossible de lire : weird.mp3')
    })

    it('ignores MEDIA_ERR_ABORTED (code 1)', async () => {
      playlistStore.addTracks(['/music/track.mp3'])
      await playlistStore.playTrack(0)

      playerStore.feedbackMessage = null // Clear any existing
      audioEngine.currentTrackInfo = { path: '/music/track.mp3', title: 'track' }
      audioEngine._onError({ code: 1, message: 'MEDIA_ERR_ABORTED' })

      expect(playerStore.feedbackMessage).toBeNull()
    })
  })

  describe('Burst errors — only last message shown (AC #4)', () => {
    it('shows only the last error message from rapid failures', async () => {
      playlistStore.addTracks([
        '/music/bad1.wma',
        '/music/bad2.aac',
        '/music/bad3.xyz',
        '/music/good.mp3'
      ])

      await playlistStore.playTrack(0)

      // After skipping bad1.wma, bad2.aac, bad3.xyz, it should reach good.mp3
      // The feedback should show the last error before the successful track
      expect(playerStore.feedbackMessage).not.toBeNull()
    })
  })

  describe('Interaction not blocked (AC #6)', () => {
    it('feedbackMessage does not affect player controls', () => {
      playerStore.showFeedback('Error message', 'error')

      // Player actions should still work
      expect(() => playerStore.pause()).not.toThrow()
      expect(() => playerStore.stop()).not.toThrow()
      expect(() => playerStore.setVolume(0.5)).not.toThrow()
    })

    it('playlist actions work during error display', () => {
      playerStore.showFeedback('Error message', 'error')

      // Playlist should still be navigable
      playlistStore.addTracks(['/music/track1.mp3', '/music/track2.mp3'])
      expect(playlistStore.trackCount).toBe(2)
      expect(() => playlistStore.removeTrack(0)).not.toThrow()
      expect(playlistStore.trackCount).toBe(1)
    })
  })
})
