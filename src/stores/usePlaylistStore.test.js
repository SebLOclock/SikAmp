import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlaylistStore } from './usePlaylistStore'

// Mock Tauri invoke
const mockInvoke = vi.fn().mockRejectedValue(new Error('not in Tauri'))
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args)
}))

// Mock audioEngine
vi.mock('@/engine/audioEngine', () => ({
  default: {
    _audioElement: null,
    loadAndPlay: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    set onTimeUpdate(cb) {},
    set onEnded(cb) {},
    set onError(cb) {},
    set onLoadedMetadata(cb) {}
  }
}))

// Mock usePlayerStore — shared instance so spy assertions work
const mockPlayerStore = {
  play: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  stop: vi.fn(),
  isPlaying: false,
  isPaused: false,
  currentTrack: null,
  feedbackMessage: null,
  showFeedback: vi.fn(),
  clearFeedback: vi.fn(),
  _handleManualCrossfadeNext: vi.fn().mockResolvedValue(false)
}
vi.mock('./usePlayerStore', () => ({
  usePlayerStore: () => mockPlayerStore
}))

describe('usePlaylistStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePlaylistStore()
    // Reset shared mock state
    mockPlayerStore.isPlaying = false
    mockPlayerStore.isPaused = false
    mockPlayerStore.play.mockClear()
    mockPlayerStore.stop.mockClear()
    mockPlayerStore.clearFeedback.mockClear()
    mockPlayerStore.showFeedback.mockClear()
    mockPlayerStore._handleManualCrossfadeNext.mockClear()
    mockInvoke.mockReset()
    mockInvoke.mockRejectedValue(new Error('not in Tauri'))
  })

  describe('initial state', () => {
    it('has empty tracks array', () => {
      expect(store.tracks).toEqual([])
    })

    it('has currentIndex of -1', () => {
      expect(store.currentIndex).toBe(-1)
    })

    it('has isShuffled as false', () => {
      expect(store.isShuffled).toBe(false)
    })

    it('has repeatMode as none', () => {
      expect(store.repeatMode).toBe('none')
    })
  })

  describe('getters', () => {
    it('currentTrack returns null when no track selected', () => {
      expect(store.currentTrack).toBeNull()
    })

    it('currentTrack returns track at currentIndex', () => {
      store.addTracks(['/music/song.mp3'])
      store.currentIndex = 0
      expect(store.currentTrack).toEqual({
        path: '/music/song.mp3',
        title: 'song',
        artist: 'Inconnu',
        duration: 0,
        bitrate: null,
        sampleRate: null,
        channels: null
      })
    })

    it('trackCount returns number of tracks', () => {
      expect(store.trackCount).toBe(0)
      store.addTracks(['/a.mp3', '/b.mp3'])
      expect(store.trackCount).toBe(2)
    })

    it('isEmpty returns true for empty playlist', () => {
      expect(store.isEmpty).toBe(true)
    })

    it('isEmpty returns false when tracks exist', () => {
      store.addTracks(['/a.mp3'])
      expect(store.isEmpty).toBe(false)
    })

    describe('canPlayPrevious', () => {
      it('returns false for empty playlist', () => {
        expect(store.canPlayPrevious).toBe(false)
      })

      it('returns false when currentIndex is -1', () => {
        store.addTracks(['/a.mp3'])
        expect(store.canPlayPrevious).toBe(false)
      })

      it('returns false at index 0 in repeat none', () => {
        store.addTracks(['/a.mp3', '/b.mp3'])
        store.currentIndex = 0
        store.repeatMode = 'none'
        expect(store.canPlayPrevious).toBe(false)
      })

      it('returns true at index 0 in repeat all', () => {
        store.addTracks(['/a.mp3', '/b.mp3'])
        store.currentIndex = 0
        store.repeatMode = 'all'
        expect(store.canPlayPrevious).toBe(true)
      })

      it('returns true at index 0 in repeat one', () => {
        store.addTracks(['/a.mp3', '/b.mp3'])
        store.currentIndex = 0
        store.repeatMode = 'one'
        expect(store.canPlayPrevious).toBe(true)
      })

      it('returns true at index > 0 in repeat none', () => {
        store.addTracks(['/a.mp3', '/b.mp3'])
        store.currentIndex = 1
        store.repeatMode = 'none'
        expect(store.canPlayPrevious).toBe(true)
      })
    })
  })

  describe('addTracks', () => {
    it('adds tracks with extracted info', () => {
      store.addTracks(['/music/My Song.mp3', '/music/Another Track.ogg'])
      expect(store.tracks).toHaveLength(2)
      expect(store.tracks[0].title).toBe('My Song')
      expect(store.tracks[0].path).toBe('/music/My Song.mp3')
      expect(store.tracks[1].title).toBe('Another Track')
    })

    it('appends to existing tracks', () => {
      store.addTracks(['/a.mp3'])
      store.addTracks(['/b.mp3'])
      expect(store.tracks).toHaveLength(2)
    })

    it('does not interrupt playback when adding tracks during playback', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 0
      mockPlayerStore.isPlaying = true
      // Add more tracks while playing
      store.addTracks(['/c.mp3', '/d.mp3'])
      // Playback state unchanged
      expect(mockPlayerStore.stop).not.toHaveBeenCalled()
      expect(mockPlayerStore.pause).not.toHaveBeenCalled()
      expect(store.currentIndex).toBe(0)
      expect(store.tracks).toHaveLength(4)
    })
  })

  describe('removeTrack', () => {
    beforeEach(() => {
      store.addTracks(['/a.mp3', '/b.mp3', '/c.mp3'])
    })

    it('removes track at index', () => {
      store.removeTrack(1)
      expect(store.tracks).toHaveLength(2)
      expect(store.tracks[1].title).toBe('c')
    })

    it('adjusts currentIndex when removing before current', () => {
      store.currentIndex = 2
      store.removeTrack(0)
      expect(store.currentIndex).toBe(1)
    })

    it('advances to next track when removing current playing track', () => {
      store.currentIndex = 1
      mockPlayerStore.isPlaying = true
      store.removeTrack(1)
      // Should advance: currentIndex set to 1 (was b, now c is at index 1)
      expect(store.currentIndex).toBe(1)
      mockPlayerStore.isPlaying = false
    })

    it('stops playback when removing the only playing track', () => {
      store.clearPlaylist()
      store.addTracks(['/only.mp3'])
      store.currentIndex = 0
      mockPlayerStore.isPlaying = true
      mockPlayerStore.stop.mockClear()
      store.removeTrack(0)
      expect(mockPlayerStore.stop).toHaveBeenCalled()
      expect(store.currentIndex).toBe(-1)
    })

    it('resets currentIndex when removing current non-playing track', () => {
      store.currentIndex = 1
      store.removeTrack(1)
      expect(store.currentIndex).toBe(-1)
    })

    it('ignores invalid indices', () => {
      store.removeTrack(-1)
      store.removeTrack(10)
      expect(store.tracks).toHaveLength(3)
    })
  })

  describe('moveTrack', () => {
    beforeEach(() => {
      store.addTracks(['/a.mp3', '/b.mp3', '/c.mp3', '/d.mp3'])
    })

    it('moves track forward', () => {
      store.moveTrack(0, 2)
      expect(store.tracks[0].title).toBe('b')
      expect(store.tracks[1].title).toBe('c')
      expect(store.tracks[2].title).toBe('a')
    })

    it('moves track backward', () => {
      store.moveTrack(3, 1)
      expect(store.tracks[0].title).toBe('a')
      expect(store.tracks[1].title).toBe('d')
      expect(store.tracks[2].title).toBe('b')
    })

    it('updates currentIndex when moving the current track forward', () => {
      store.currentIndex = 0
      store.moveTrack(0, 2)
      expect(store.currentIndex).toBe(2)
    })

    it('updates currentIndex when moving the current track backward', () => {
      store.currentIndex = 3
      store.moveTrack(3, 1)
      expect(store.currentIndex).toBe(1)
    })

    it('adjusts currentIndex when moving a track from before to after current', () => {
      store.currentIndex = 1
      store.moveTrack(0, 3)
      expect(store.currentIndex).toBe(0)
    })

    it('adjusts currentIndex when moving a track from after to before current', () => {
      store.currentIndex = 1
      store.moveTrack(3, 0)
      expect(store.currentIndex).toBe(2)
    })

    it('does nothing when from equals to', () => {
      store.moveTrack(1, 1)
      expect(store.tracks[1].title).toBe('b')
    })

    it('ignores invalid indices', () => {
      store.moveTrack(-1, 2)
      store.moveTrack(0, 10)
      expect(store.tracks).toHaveLength(4)
    })
  })

  describe('newPlaylist', () => {
    it('clears all tracks and resets index', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      store.newPlaylist()
      expect(store.tracks).toEqual([])
      expect(store.currentIndex).toBe(-1)
    })

    it('calls playerStore.stop()', () => {
      store.addTracks(['/a.mp3'])
      store.currentIndex = 0
      store.newPlaylist()
      expect(mockPlayerStore.stop).toHaveBeenCalled()
    })

    it('resets consecutiveErrors', () => {
      store._consecutiveErrors = 5
      store.newPlaylist()
      expect(store._consecutiveErrors).toBe(0)
    })
  })

  describe('clearPlaylist', () => {
    it('removes all tracks and resets index', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      store.clearPlaylist()
      expect(store.tracks).toEqual([])
      expect(store.currentIndex).toBe(-1)
    })

    it('calls playerStore.stop()', () => {
      store.addTracks(['/a.mp3'])
      store.currentIndex = 0
      store.clearPlaylist()
      expect(mockPlayerStore.stop).toHaveBeenCalled()
    })
  })

  describe('playTrack', () => {
    beforeEach(() => {
      store.addTracks(['/a.mp3', '/b.mp3', '/c.mp3'])
    })

    it('sets currentIndex', () => {
      store.playTrack(1)
      expect(store.currentIndex).toBe(1)
    })

    it('ignores invalid indices', () => {
      store.playTrack(-1)
      expect(store.currentIndex).toBe(-1)
      store.playTrack(10)
      expect(store.currentIndex).toBe(-1)
    })
  })

  describe('playNext', () => {
    beforeEach(() => {
      store.addTracks(['/a.mp3', '/b.mp3', '/c.mp3'])
      store.currentIndex = 0
    })

    it('advances to next track', () => {
      store.playNext()
      expect(store.currentIndex).toBe(1)
    })

    it('does nothing on empty playlist', () => {
      store.clearPlaylist()
      store.playNext()
      expect(store.currentIndex).toBe(-1)
    })

    it('wraps around with repeat all', () => {
      store.currentIndex = 2
      store.repeatMode = 'all'
      store.playNext()
      expect(store.currentIndex).toBe(0)
    })

    it('stops at end without repeat', () => {
      store.currentIndex = 2
      store.playNext()
      expect(store.currentIndex).toBe(2) // stays at last
    })

    it('repeats same track with repeat one', () => {
      store.repeatMode = 'one'
      store.playNext()
      expect(store.currentIndex).toBe(0)
    })
  })

  describe('playPrevious', () => {
    beforeEach(() => {
      store.addTracks(['/a.mp3', '/b.mp3', '/c.mp3'])
      store.currentIndex = 1
    })

    it('goes to previous track', () => {
      store.playPrevious()
      expect(store.currentIndex).toBe(0)
    })

    it('wraps to last with repeat all', () => {
      store.currentIndex = 0
      store.repeatMode = 'all'
      store.playPrevious()
      expect(store.currentIndex).toBe(2)
    })

    it('does nothing at first track without repeat', () => {
      store.currentIndex = 0
      store.playPrevious()
      expect(store.currentIndex).toBe(0) // stays, playTrack(0) not called again
    })

    it('does nothing when currentIndex is -1', () => {
      store.currentIndex = -1
      store.playPrevious()
      expect(store.currentIndex).toBe(-1)
    })

    it('does nothing on empty playlist', () => {
      store.clearPlaylist()
      store.playPrevious()
      expect(store.currentIndex).toBe(-1)
    })

    it('repeats same track with repeat one', () => {
      store.currentIndex = 1
      store.repeatMode = 'one'
      store.playPrevious()
      expect(store.currentIndex).toBe(1)
    })
  })

  describe('peekNextTrack', () => {
    it('returns null for empty playlist', () => {
      expect(store.peekNextTrack()).toBeNull()
    })

    it('returns next track with index', () => {
      store.addTracks(['/a.mp3', '/b.mp3', '/c.mp3'])
      store.currentIndex = 0
      const result = store.peekNextTrack()
      expect(result.track.title).toBe('b')
      expect(result.index).toBe(1)
    })

    it('returns null at end of playlist in none mode', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      store.repeatMode = 'none'
      expect(store.peekNextTrack()).toBeNull()
    })

    it('wraps around in repeat all mode', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      store.repeatMode = 'all'
      const result = store.peekNextTrack()
      expect(result.track.title).toBe('a')
      expect(result.index).toBe(0)
    })

    it('returns current track in repeat one mode', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 0
      store.repeatMode = 'one'
      const result = store.peekNextTrack()
      expect(result.track.title).toBe('a')
      expect(result.index).toBe(0)
    })
  })

  describe('getNextTrack', () => {
    it('returns null for empty playlist', () => {
      expect(store.getNextTrack()).toBeNull()
    })

    it('returns next track', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 0
      expect(store.getNextTrack().title).toBe('b')
    })

    it('wraps around', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      expect(store.getNextTrack().title).toBe('a')
    })
  })

  describe('getPreviousTrack', () => {
    it('returns null for empty playlist', () => {
      expect(store.getPreviousTrack()).toBeNull()
    })

    it('returns previous track', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      expect(store.getPreviousTrack().title).toBe('a')
    })

    it('wraps to last', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 0
      expect(store.getPreviousTrack().title).toBe('b')
    })
  })

  describe('playlistName and playlistPath state', () => {
    it('initializes playlistName and playlistPath as null', () => {
      expect(store.playlistName).toBeNull()
      expect(store.playlistPath).toBeNull()
    })

    it('newPlaylist resets playlistName and playlistPath', () => {
      store.playlistName = 'My Playlist'
      store.playlistPath = '/tmp/playlist.m3u8'
      store.newPlaylist()
      expect(store.playlistName).toBeNull()
      expect(store.playlistPath).toBeNull()
    })

    it('clearPlaylist resets playlistName and playlistPath', () => {
      store.playlistName = 'My Playlist'
      store.playlistPath = '/tmp/playlist.m3u8'
      store.clearPlaylist()
      expect(store.playlistName).toBeNull()
      expect(store.playlistPath).toBeNull()
    })
  })

  describe('savePlaylist', () => {
    it('does nothing when playlist is empty', async () => {
      await store.savePlaylist()
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('saves directly when playlistPath exists (no dialog)', async () => {
      store.addTracks(['/music/a.mp3', '/music/b.flac'])
      store.playlistPath = '/tmp/my-playlist.m3u8'
      mockInvoke.mockResolvedValueOnce(undefined)

      await store.savePlaylist()

      expect(mockInvoke).toHaveBeenCalledWith('save_playlist', {
        path: '/tmp/my-playlist.m3u8',
        tracks: expect.arrayContaining([
          expect.objectContaining({ path: '/music/a.mp3' }),
          expect.objectContaining({ path: '/music/b.flac' })
        ])
      })
      expect(store.playlistPath).toBe('/tmp/my-playlist.m3u8')
      expect(store.playlistName).toBe('my-playlist')
      expect(mockPlayerStore.showFeedback).toHaveBeenCalledWith('Playlist sauvegardée', 'success')
    })

    it('shows error feedback on save failure', async () => {
      store.addTracks(['/music/a.mp3'])
      store.playlistPath = '/tmp/test.m3u8'
      mockInvoke.mockRejectedValueOnce(new Error('write error'))

      await store.savePlaylist()

      expect(mockPlayerStore.showFeedback).toHaveBeenCalledWith('Erreur de sauvegarde', 'error')
    })
  })

  describe('loadPlaylist', () => {
    it('replaces tracks with loaded entries', async () => {
      // Mock dialog to return a path
      vi.doMock('@tauri-apps/plugin-dialog', () => ({
        open: vi.fn().mockResolvedValue('/tmp/loaded.m3u8')
      }))

      store.addTracks(['/old/track.mp3'])
      store.currentIndex = 0

      const loadedEntries = [
        { path: '/music/a.mp3', title: 'Song A', artist: 'Artist A', duration: 200, exists: true },
        { path: '/music/missing.mp3', title: 'Gone', artist: 'Nobody', duration: 100, exists: false }
      ]
      mockInvoke.mockResolvedValueOnce(loadedEntries)

      await store.loadPlaylist()

      expect(store.tracks).toHaveLength(2)
      expect(store.tracks[0].title).toBe('Song A')
      expect(store.tracks[0].missing).toBeFalsy()
      expect(store.tracks[1].title).toBe('Gone')
      expect(store.tracks[1].missing).toBe(true)
      expect(store.playlistPath).toBe('/tmp/loaded.m3u8')
      expect(store.playlistName).toBe('loaded')
      expect(store.currentIndex).toBe(-1)
      expect(mockPlayerStore.showFeedback).toHaveBeenCalledWith('Playlist chargée, 2 morceaux', 'success')
    })

    it('shows error feedback on load failure', async () => {
      vi.doMock('@tauri-apps/plugin-dialog', () => ({
        open: vi.fn().mockResolvedValue('/tmp/bad.m3u8')
      }))

      mockInvoke.mockRejectedValueOnce(new Error('parse error'))

      await store.loadPlaylist()

      expect(mockPlayerStore.showFeedback).toHaveBeenCalledWith('Erreur de chargement', 'error')
    })
  })
})
