import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import { usePlayerStore } from './usePlayerStore'
import audioEngine from '@/engine/audioEngine'
import { isSupportedFormat, extractFileName } from '@/utils/formatValidator.js'

let endedListenerAttached = false

function extractTrackInfo(filePath) {
  const fileName = filePath.split('/').pop().split('\\').pop()
  const name = fileName.replace(/\.[^.]+$/, '')
  return { path: filePath, title: name, artist: 'Inconnu', duration: 0, bitrate: null, sampleRate: null, channels: null }
}

export const usePlaylistStore = defineStore('playlist', {
  state: () => ({
    tracks: [],
    currentIndex: -1,
    isShuffled: false,
    repeatMode: 'none', // 'none' | 'all' | 'one'
    _consecutiveErrors: 0
  }),

  getters: {
    currentTrack: (state) => {
      if (state.currentIndex >= 0 && state.currentIndex < state.tracks.length) {
        return state.tracks[state.currentIndex]
      }
      return null
    },

    trackCount: (state) => state.tracks.length,

    isEmpty: (state) => state.tracks.length === 0,

    canPlayPrevious: (state) => {
      if (state.tracks.length === 0 || state.currentIndex < 0) return false
      if (state.repeatMode === 'none') return state.currentIndex > 0
      return true
    }
  },

  actions: {
    init() {
      this._subscribeToEnded()
    },

    addTracks(filePaths) {
      const newTracks = filePaths.map(fp => extractTrackInfo(fp))
      const startIndex = this.tracks.length
      this.tracks.push(...newTracks)
      // Clear any persistent error feedback since new tracks are available
      const playerStore = usePlayerStore()
      playerStore.clearFeedback()
      this._consecutiveErrors = 0
      console.log(`[PlaylistStore] Added ${newTracks.length} tracks, total: ${this.tracks.length}`)
      this._enrichMetadata(startIndex, newTracks.length)
    },

    async _enrichMetadata(startIndex, count) {
      for (let i = 0; i < count; i++) {
        const trackIndex = startIndex + i
        if (trackIndex >= this.tracks.length) break
        const track = this.tracks[trackIndex]
        const expectedPath = track.path
        try {
          const meta = await invoke('get_audio_metadata', { path: expectedPath })
          // Post-await: verify track identity hasn't changed (playlist may have been modified)
          if (trackIndex >= this.tracks.length || this.tracks[trackIndex]?.path !== expectedPath) continue
          track.title = meta.title || track.title
          track.artist = meta.artist || 'Inconnu'
          track.duration = meta.duration || 0
          track.bitrate = meta.bitrate ?? null
          track.sampleRate = meta.sampleRate ?? null
          track.channels = meta.channels ?? null
        } catch (err) {
          console.warn(`[PlaylistStore] Metadata extraction failed for ${expectedPath}:`, err)
        }
      }
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
      this._consecutiveErrors = 0
      console.log('[PlaylistStore] Playlist cleared')
    },

    async playTrack(index) {
      if (index < 0 || index >= this.tracks.length) return
      this.currentIndex = index
      const track = this.tracks[index]
      const playerStore = usePlayerStore()

      // PRE-CHECK: validate format before attempting playback
      if (!isSupportedFormat(track.path)) {
        const fileName = extractFileName(track.path)
        console.warn(`[PlaylistStore] Unsupported format: ${fileName}`)
        playerStore.showFeedback(`Format non supporté : ${fileName}`, 'error')
        this._handlePlaybackError()
        return
      }

      await playerStore.play(track.path)
      // _consecutiveErrors is reset in onLoadedMetadata (reliable success signal)
      // Async errors (corrupt/missing) handled by audioEngine.onError → _handlePlaybackError
      this._subscribeToEnded()
      console.log('[PlaylistStore] Playing track:', track.title)
    },

    _handlePlaybackError() {
      this._consecutiveErrors++

      // Anti-infinite-loop: if we've tried all tracks, stop
      if (this._consecutiveErrors >= this.tracks.length) {
        console.warn(`[PlaylistStore] All ${this.tracks.length} tracks failed, stopping`)
        const playerStore = usePlayerStore()
        playerStore.isPlaying = false
        playerStore.isPaused = false
        // Keep the last error message visible (persistent)
        if (playerStore.feedbackMessage) {
          playerStore.showFeedback(playerStore.feedbackMessage.text, 'error', true)
        }
        return
      }

      this.playNext()
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
      if (this.currentIndex < 0) return

      if (this.repeatMode === 'one') {
        this.playTrack(this.currentIndex)
        return
      }

      let prevIndex = this.currentIndex - 1
      if (prevIndex < 0) {
        if (this.repeatMode === 'all') {
          prevIndex = this.tracks.length - 1
        } else {
          return // ne rien faire en mode 'none' au début de la playlist
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
            this._consecutiveErrors = 0 // Successful playback completed
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
