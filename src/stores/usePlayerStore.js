import { defineStore } from 'pinia'
import audioEngine from '@/engine/audioEngine.js'
import { DEFAULT_VOLUME } from '@/utils/constants.js'

let eventsSubscribed = false

export const usePlayerStore = defineStore('player', {
  state: () => ({
    isPlaying: false,
    isPaused: false,
    currentTrack: null, // { path, title, artist, duration }
    currentTime: 0,
    duration: 0,
    volume: DEFAULT_VOLUME
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
      }

      audioEngine.onError = () => {
        this.isPlaying = false
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
