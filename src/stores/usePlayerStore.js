import { defineStore } from 'pinia'
import audioEngine from '@/engine/audioEngine.js'
import { DEFAULT_VOLUME, FEEDBACK_COLORS, FEEDBACK_DURATION } from '@/utils/constants.js'
import { usePreferencesStore } from './usePreferencesStore'
import { extractFileName } from '@/utils/formatValidator.js'

let eventsSubscribed = false
let feedbackTimer = null
let crossfadeTriggered = false
let preCrossfadeIndex = -1

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
      crossfadeTriggered = false
      try {
        await audioEngine.loadAndPlay(filePath)
        this.isPlaying = true
        this.isPaused = false
      } catch (err) {
        console.error('[PlayerStore] Play failed:', err.message)
        this.isPlaying = false
        this.isPaused = false
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
      // Restore playlist index if crossfade was in progress
      if (audioEngine.isCrossfading && preCrossfadeIndex >= 0) {
        import('./usePlaylistStore').then(({ usePlaylistStore }) => {
          const playlistStore = usePlaylistStore()
          playlistStore.currentIndex = preCrossfadeIndex
          preCrossfadeIndex = -1
        }).catch(() => {})
      }
      audioEngine.stop()
      this.isPlaying = false
      this.isPaused = false
      this.currentTime = 0
      crossfadeTriggered = false
      preCrossfadeIndex = -1
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
      // Reset crossfade trigger if user seeks backward
      if (this.duration > 0) {
        const preferencesStore = usePreferencesStore()
        const timeRemaining = this.duration - audioEngine.currentTime
        if (timeRemaining > preferencesStore.crossfadeDuration) {
          crossfadeTriggered = false
        }
      }
    },

    async _triggerCrossfade() {
      if (crossfadeTriggered) return
      crossfadeTriggered = true

      const preferencesStore = usePreferencesStore()
      if (!preferencesStore.crossfadeEnabled) return

      const { usePlaylistStore } = await import('./usePlaylistStore')
      const playlistStore = usePlaylistStore()

      // Try to find a valid next track, skipping errored ones (AC6)
      const maxRetries = playlistStore.tracks.length
      let candidateIndex = playlistStore.currentIndex
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        candidateIndex = candidateIndex + 1
        if (candidateIndex >= playlistStore.tracks.length) {
          if (playlistStore.repeatMode === 'all') {
            candidateIndex = 0
          } else {
            console.log('[PlayerStore] No next track for crossfade')
            return
          }
        }
        if (candidateIndex === playlistStore.currentIndex) {
          console.log('[PlayerStore] No valid next track for crossfade')
          return
        }

        const candidate = playlistStore.tracks[candidateIndex]
        console.log('[PlayerStore] Crossfade triggered — preloading:', candidate.title)

        try {
          await audioEngine.preloadOnInactive(candidate.path)
        } catch (err) {
          console.warn('[PlayerStore] Crossfade preload failed, trying next:', err)
          this.showFeedback(`Impossible de lire : ${extractFileName(candidate.path)}`, 'error')
          continue
        }

        // Clamp crossfade duration to remaining track time
        const timeRemaining = this.duration - audioEngine.currentTime
        const effectiveDuration = Math.min(preferencesStore.crossfadeDuration, Math.max(0.5, timeRemaining))
        const durationMs = effectiveDuration * 1000
        try {
          preCrossfadeIndex = playlistStore.currentIndex
          await audioEngine.startCrossfade(durationMs)
          playlistStore.currentIndex = candidateIndex
          return // Success
        } catch (err) {
          console.error('[PlayerStore] Crossfade start failed:', err)
          crossfadeTriggered = false
          preCrossfadeIndex = -1
          return
        }
      }
    },

    async _handleManualCrossfadeNext() {
      const preferencesStore = usePreferencesStore()
      if (!preferencesStore.crossfadeEnabled || audioEngine.isCrossfading) {
        return false // Fall through to normal playNext
      }

      const { usePlaylistStore } = await import('./usePlaylistStore')
      const playlistStore = usePlaylistStore()
      const next = playlistStore.peekNextTrack()

      if (!next) return false

      crossfadeTriggered = true

      try {
        await audioEngine.preloadOnInactive(next.track.path)
        // Clamp crossfade duration to remaining track time
        const timeRemaining = this.duration - audioEngine.currentTime
        const effectiveDuration = Math.min(preferencesStore.crossfadeDuration, Math.max(0.5, timeRemaining))
        const durationMs = effectiveDuration * 1000
        preCrossfadeIndex = playlistStore.currentIndex
        await audioEngine.startCrossfade(durationMs)
        playlistStore.currentIndex = next.index
        return true
      } catch (err) {
        console.warn('[PlayerStore] Manual crossfade failed, falling back to direct play:', err)
        crossfadeTriggered = false
        preCrossfadeIndex = -1
        return false
      }
    },

    _subscribeToEvents() {
      if (eventsSubscribed) return // P2: subscribe only once

      audioEngine.onTimeUpdate = (time) => {
        this.currentTime = time

        // Check if we should trigger crossfade
        if (this.duration > 0 && !crossfadeTriggered && !audioEngine.isCrossfading) {
          const preferencesStore = usePreferencesStore()
          if (preferencesStore.crossfadeEnabled) {
            const timeRemaining = this.duration - time
            if (timeRemaining <= preferencesStore.crossfadeDuration && timeRemaining > 0) {
              this._triggerCrossfade()
            }
          }
        }
      }

      audioEngine.onEnded = () => {
        // If crossfade already handled the transition, don't do anything
        if (audioEngine.isCrossfading) return

        this.isPlaying = false
        this.isPaused = false
        this.currentTime = 0
        crossfadeTriggered = false

        // Auto-advance to next track
        import('./usePlaylistStore').then(async ({ usePlaylistStore }) => {
          const playlistStore = usePlaylistStore()
          playlistStore._consecutiveErrors = 0
          await playlistStore.playNext()
        }).catch(err => console.error('[PlayerStore] Failed to auto-advance:', err))
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

      audioEngine.onCrossfadeComplete = () => {
        console.log('[PlayerStore] Crossfade complete — updating display')
        crossfadeTriggered = false
        preCrossfadeIndex = -1
        // Update display with new track metadata
        const audio = audioEngine._audioElement
        if (audio) {
          this.duration = audio.duration || 0
          this.currentTime = audio.currentTime || 0
        }
        if (audioEngine.currentTrackInfo) {
          // Reload track info from playlist for enriched metadata
          import('./usePlaylistStore').then(({ usePlaylistStore }) => {
            const playlistStore = usePlaylistStore()
            const currentTrack = playlistStore.currentTrack
            if (currentTrack) {
              this.currentTrack = currentTrack
              audioEngine.currentTrackInfo = currentTrack
            }
          }).catch(err => console.warn('[PlayerStore] Failed to update track metadata after crossfade:', err))
        }
        this.isPlaying = true
        this.isPaused = false
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
