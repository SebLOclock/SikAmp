import { defineStore } from 'pinia'
import { usePlayerStore } from './usePlayerStore'
import audioEngine from '@/engine/audioEngine'

let endedListenerAttached = false

function extractTrackInfo(filePath) {
  const fileName = filePath.split('/').pop().split('\\').pop()
  const name = fileName.replace(/\.[^.]+$/, '')
  return { path: filePath, title: name, artist: 'Unknown', duration: 0 }
}

export const usePlaylistStore = defineStore('playlist', {
  state: () => ({
    tracks: [],
    currentIndex: -1,
    isShuffled: false,
    repeatMode: 'none' // 'none' | 'all' | 'one'
  }),

  getters: {
    currentTrack: (state) => {
      if (state.currentIndex >= 0 && state.currentIndex < state.tracks.length) {
        return state.tracks[state.currentIndex]
      }
      return null
    },

    trackCount: (state) => state.tracks.length,

    isEmpty: (state) => state.tracks.length === 0
  },

  actions: {
    init() {
      this._subscribeToEnded()
    },

    addTracks(filePaths) {
      const newTracks = filePaths.map(fp => extractTrackInfo(fp))
      this.tracks.push(...newTracks)
      console.log(`[PlaylistStore] Added ${newTracks.length} tracks, total: ${this.tracks.length}`)
    },

    removeTrack(index) {
      if (index < 0 || index >= this.tracks.length) return
      this.tracks.splice(index, 1)
      if (index < this.currentIndex) {
        this.currentIndex--
      } else if (index === this.currentIndex) {
        this.currentIndex = -1
      }
      console.log('[PlaylistStore] Track removed, total:', this.tracks.length)
    },

    clearPlaylist() {
      this.tracks = []
      this.currentIndex = -1
      console.log('[PlaylistStore] Playlist cleared')
    },

    playTrack(index) {
      if (index < 0 || index >= this.tracks.length) return
      this.currentIndex = index
      const track = this.tracks[index]
      const playerStore = usePlayerStore()
      playerStore.play(track.path)
      this._subscribeToEnded()
      console.log('[PlaylistStore] Playing track:', track.title)
    },

    playNext() {
      if (this.tracks.length === 0) return

      if (this.repeatMode === 'one') {
        this.playTrack(this.currentIndex)
        return
      }

      let nextIndex = this.currentIndex + 1
      if (nextIndex >= this.tracks.length) {
        if (this.repeatMode === 'all') {
          nextIndex = 0
        } else {
          console.log('[PlaylistStore] End of playlist reached')
          return
        }
      }
      this.playTrack(nextIndex)
    },

    playPrevious() {
      if (this.tracks.length === 0) return

      let prevIndex = this.currentIndex - 1
      if (prevIndex < 0) {
        if (this.repeatMode === 'all') {
          prevIndex = this.tracks.length - 1
        } else {
          prevIndex = 0
        }
      }
      this.playTrack(prevIndex)
    },

    getNextTrack() {
      if (this.tracks.length === 0) return null
      const nextIndex = (this.currentIndex + 1) % this.tracks.length
      return this.tracks[nextIndex]
    },

    getPreviousTrack() {
      if (this.tracks.length === 0) return null
      const prevIndex = this.currentIndex <= 0 ? this.tracks.length - 1 : this.currentIndex - 1
      return this.tracks[prevIndex]
    },

    _subscribeToEnded() {
      if (endedListenerAttached) return
      // Option B: subscribe directly to the audio element's ended event
      // This works alongside usePlayerStore's onEnded callback (which uses the setter)
      const checkAndAttach = () => {
        const el = audioEngine._audioElement
        if (el) {
          el.addEventListener('ended', () => {
            this.playNext()
          })
          endedListenerAttached = true
          console.log('[PlaylistStore] Subscribed to audio ended event')
        }
      }
      checkAndAttach()
    }
  }
})
