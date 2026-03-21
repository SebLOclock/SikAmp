// [AudioEngine] Core audio playback engine
// Uses MediaElementAudioSourceNode for streaming (not AudioBufferSourceNode)
// Chain: <audio> → MediaElementAudioSourceNode → GainNode → AudioContext.destination

import { convertFileSrc } from '@tauri-apps/api/core'
import { DEFAULT_VOLUME } from '@/utils/constants.js'

let audioContext = null
let gainNode = null
let sourceNode = null
let audioElement = null

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
    gainNode = audioContext.createGain()
    gainNode.gain.value = DEFAULT_VOLUME // P3: init at DEFAULT_VOLUME, not 1.0
    gainNode.connect(audioContext.destination)
  }
  return audioContext
}

async function ensureAudioContext() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx
}

function extractTrackInfo(filePath) {
  const fileName = filePath.split('/').pop().split('\\').pop()
  const name = fileName.replace(/\.[^.]+$/, '')
  return { path: filePath, title: name, artist: 'Inconnu', duration: 0 }
}

// Event callbacks
let onTimeUpdate = null
let onEnded = null
let onError = null
let onLoadedMetadata = null

function setupAudioEvents(audio) {
  audio.addEventListener('timeupdate', () => {
    if (onTimeUpdate) onTimeUpdate(audio.currentTime)
  })
  audio.addEventListener('ended', () => {
    if (onEnded) onEnded()
  })
  audio.addEventListener('error', (e) => {
    console.error('[AudioEngine] Audio error:', e.target.error?.message || 'Unknown error')
    if (onError) onError(e.target.error)
  })
  audio.addEventListener('loadedmetadata', () => {
    if (onLoadedMetadata) onLoadedMetadata({
      duration: audio.duration,
      trackInfo: audioEngine.currentTrackInfo
    })
  })
}

const audioEngine = {
  currentTrackInfo: null,

  async loadAndPlay(filePath) {
    const ctx = await ensureAudioContext()

    // Create audio element and wire it once — reuse for all tracks
    if (!audioElement) {
      audioElement = new Audio()
      setupAudioEvents(audioElement)
      sourceNode = ctx.createMediaElementSource(audioElement)
      sourceNode.connect(gainNode)
    }

    // Convert file path to asset URL for Tauri
    const url = convertFileSrc(filePath)
    audioElement.src = url
    this.currentTrackInfo = extractTrackInfo(filePath)

    try {
      await audioElement.play()
    } catch (err) {
      console.error('[AudioEngine] Playback failed:', err.message)
      throw err
    }
  },

  pause() {
    if (audioElement) {
      audioElement.pause()
    }
  },

  async resume() {
    if (!audioElement) return
    await ensureAudioContext() // P1: await the context resume
    return audioElement.play()
  },

  stop() {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }
  },

  setVolume(level) {
    const clampedLevel = Math.max(0, Math.min(1, level))
    if (gainNode) {
      gainNode.gain.value = clampedLevel
    }
  },

  seek(time) {
    if (!audioElement) return
    const clamped = Math.max(0, Math.min(time, this.duration || 0))
    audioElement.currentTime = clamped
  },

  get currentTime() {
    return audioElement ? audioElement.currentTime : 0
  },

  get duration() {
    return audioElement && !isNaN(audioElement.duration) ? audioElement.duration : 0
  },

  get isPlaying() {
    return audioElement ? !audioElement.paused && !audioElement.ended : false
  },

  // Event setters
  set onTimeUpdate(cb) { onTimeUpdate = cb },
  set onEnded(cb) { onEnded = cb },
  set onError(cb) { onError = cb },
  set onLoadedMetadata(cb) { onLoadedMetadata = cb },

  // Expose for testing
  get _audioElement() { return audioElement },
  get _audioContext() { return audioContext },
  get _gainNode() { return gainNode }
}

export default audioEngine
