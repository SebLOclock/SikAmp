import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlaylistStore } from './usePlaylistStore'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockRejectedValue(new Error('not in Tauri'))
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

// Mock usePlayerStore
vi.mock('./usePlayerStore', () => ({
  usePlayerStore: () => ({
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    isPaused: false,
    currentTrack: null
  })
}))

describe('usePlaylistStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePlaylistStore()
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

    it('resets currentIndex when removing current track', () => {
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

  describe('clearPlaylist', () => {
    it('removes all tracks and resets index', () => {
      store.addTracks(['/a.mp3', '/b.mp3'])
      store.currentIndex = 1
      store.clearPlaylist()
      expect(store.tracks).toEqual([])
      expect(store.currentIndex).toBe(-1)
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
})
