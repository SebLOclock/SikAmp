import { defineStore } from 'pinia'
import audioEngine from '@/engine/audioEngine.js'
import { DEFAULT_VOLUME, FEEDBACK_COLORS, FEEDBACK_DURATION } from '@/utils/constants.js'
import { usePreferencesStore } from './usePreferencesStore'
import { extractFileName } from '@/utils/formatValidator.js'

let eventsSubscribed = false
let feedbackTimer = null

export const usePlayerStore = defineStore('player', {
  state: () => ({
    isPlaying: false,
    isPaused: false,
    currentTrack: null, // { path, title, artist, duration }
    currentTime: 0,
    duration: 0,
    volume: DEFAULT_VOLUME,
    feedbackMessage: null // { text, color } or null
  }),

  getters: {
    isStopped: (state) => !state.isPlaying && !state.isPaused,

    formattedCurrentTime: (state) => formatTime(state.currentTime),

    formattedDuration: (state) => formatTime(state.duration),

    progressPercent: (state) => {
      if (state.duration === 0) return 0
      return (state.currentTime / state.duration) * 100
    }
  },

  actions: {
    async play(filePath) {
      this._subscribeToEvents() // P2: subscribe BEFORE loadAndPlay so loadedmetadata is caught
      try {
        await audioEngine.loadAndPlay(filePath)
        this.isPlaying = true
        this.isPaused = false
      } catch (err) {
        console.error('[PlayerStore] Play failed:', err.message)
        this.isPlaying = false
        this.isPaused = false
        // Don't throw — async errors are handled by onError callback
        // which triggers _handlePlaybackError on the playlist store
      }
    },

    pause() {
      audioEngine.pause()
      this.isPlaying = false
      this.isPaused = true
    },

    async resume() {
      if (!audioEngine._audioElement) return // P4: guard against no audio element
      try {
        await audioEngine.resume()
        this.isPlaying = true
        this.isPaused = false
      } catch (err) {
        console.error('[PlayerStore] Resume failed:', err.message)
      }
    },

    stop() {
      audioEngine.stop()
      this.isPlaying = false
      this.isPaused = false
      this.currentTime = 0
    },

    setVolume(level) {
      const clamped = Math.max(0, Math.min(1, level))
      this.volume = clamped
      audioEngine.setVolume(clamped)
      const preferencesStore = usePreferencesStore()
      preferencesStore.saveVolume(clamped)
    },

    async restoreVolume() {
      const preferencesStore = usePreferencesStore()
      await preferencesStore.loadPreferences()
      this.volume = preferencesStore.volume
      // Volume will be applied to audioEngine when _subscribeToEvents runs (first play)
      // If gainNode already exists, apply immediately
      audioEngine.setVolume(this.volume)
    },

    showFeedback(text, type = 'error', persistent = false) {
      const color = FEEDBACK_COLORS[type] || FEEDBACK_COLORS.error
      this.feedbackMessage = { text, color }
      if (feedbackTimer) clearTimeout(feedbackTimer)
      if (!persistent) {
        feedbackTimer = setTimeout(() => {
          this.feedbackMessage = null
          feedbackTimer = null
        }, FEEDBACK_DURATION)
      }
    },

    clearFeedback() {
      if (feedbackTimer) clearTimeout(feedbackTimer)
      feedbackTimer = null
      this.feedbackMessage = null
    },

    seek(time) {
      audioEngine.seek(time) // P6: use public API instead of _audioElement
      this.currentTime = audioEngine.currentTime
    },

    _subscribeToEvents() {
      if (eventsSubscribed) return // P2: subscribe only once

      audioEngine.onTimeUpdate = (time) => {
        this.currentTime = time
      }

      audioEngine.onEnded = () => {
        this.isPlaying = false
        this.isPaused = false
        this.currentTime = 0
      }

      audioEngine.onLoadedMetadata = ({ duration, trackInfo }) => {
        this.duration = duration
        this.currentTrack = trackInfo
        this.clearFeedback()
        // Reset consecutive errors on confirmed successful load
        import('./usePlaylistStore').then(({ usePlaylistStore }) => {
          const playlistStore = usePlaylistStore()
          playlistStore._consecutiveErrors = 0
        }).catch(() => {})
      }

      audioEngine.onError = (error) => {
        this.isPlaying = false
        this.isPaused = false
        // Get filename from audioEngine.currentTrackInfo (set synchronously in loadAndPlay)
        const trackPath = audioEngine.currentTrackInfo?.path || ''
        const fileName = extractFileName(trackPath)
        if (error && error.code === 2) {
          this.showFeedback(`Fichier introuvable : ${fileName}`, 'error')
        } else if (error && (error.code === 3 || error.code === 4)) {
          this.showFeedback(`Impossible de lire : ${fileName}`, 'error')
        } else if (error && error.code !== 1) {
          this.showFeedback(`Impossible de lire : ${fileName}`, 'error')
        }
        // Auto-skip: lazy import to avoid circular dependency
        import('./usePlaylistStore').then(({ usePlaylistStore }) => {
          const playlistStore = usePlaylistStore()
          playlistStore._handlePlaybackError()
        }).catch(err => console.error('[PlayerStore] Failed to load playlistStore for error handling:', err))
      }

      // Apply current volume
      audioEngine.setVolume(this.volume)
      eventsSubscribed = true
    }
  }
})

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
