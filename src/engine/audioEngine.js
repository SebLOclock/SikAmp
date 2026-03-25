// [AudioEngine] Core audio playback engine — Dual-source architecture for crossfade
// Chain: Source A/B: <audio> → MediaElementAudioSourceNode → GainNode → masterGainNode → destination

import { convertFileSrc } from '@tauri-apps/api/core'
import { DEFAULT_VOLUME } from '@/utils/constants.js'

let audioContext = null
let masterGainNode = null

// Dual-source system
let sources = {
  a: { audio: null, sourceNode: null, gainNode: null },
  b: { audio: null, sourceNode: null, gainNode: null }
}
let activeSource = 'a'
let crossfadeTimer = null
let isCrossfading = false

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
    masterGainNode = audioContext.createGain()
    masterGainNode.gain.value = DEFAULT_VOLUME
    masterGainNode.connect(audioContext.destination)
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
let onCrossfadeStart = null
let onCrossfadeComplete = null

function getActiveAudio() {
  return sources[activeSource].audio
}

function getInactiveKey() {
  return activeSource === 'a' ? 'b' : 'a'
}

function setupSourceEvents(source, sourceKey) {
  source.audio.addEventListener('timeupdate', () => {
    // Only report time updates from the active source
    if (sourceKey === activeSource && onTimeUpdate) {
      onTimeUpdate(source.audio.currentTime)
    }
  })
  source.audio.addEventListener('ended', () => {
    // Only report ended from the active source (not the fading-out source)
    if (sourceKey === activeSource && !isCrossfading && onEnded) {
      onEnded()
    }
  })
  source.audio.addEventListener('error', (e) => {
    console.error('[AudioEngine] Audio error:', e.target.error?.message || 'Unknown error')
    if (onError) onError(e.target.error)
  })
  source.audio.addEventListener('loadedmetadata', () => {
    // Only report metadata from the active source
    if (sourceKey === activeSource && onLoadedMetadata) {
      onLoadedMetadata({
        duration: source.audio.duration,
        trackInfo: audioEngine.currentTrackInfo
      })
    }
  })
}

function initSource(ctx, sourceKey) {
  if (sources[sourceKey].audio) return sources[sourceKey]

  const audio = new Audio()
  const sourceNode = ctx.createMediaElementSource(audio)
  const gainNode = ctx.createGain()
  gainNode.gain.value = sourceKey === activeSource ? 1 : 0
  sourceNode.connect(gainNode)
  gainNode.connect(masterGainNode)

  sources[sourceKey] = { audio, sourceNode, gainNode }
  setupSourceEvents(sources[sourceKey], sourceKey)

  return sources[sourceKey]
}

// Equal-power crossfade curves
function generateEqualPowerCurves(steps = 100) {
  const fadeOut = new Float32Array(steps)
  const fadeIn = new Float32Array(steps)
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    fadeOut[i] = Math.cos(t * Math.PI / 2)
    fadeIn[i] = Math.sin(t * Math.PI / 2)
  }
  return { fadeOut, fadeIn }
}

const audioEngine = {
  currentTrackInfo: null,

  async loadAndPlay(filePath) {
    // Cancel any in-progress crossfade before loading a new track
    if (isCrossfading) {
      this._cancelCrossfade()
    }

    const ctx = await ensureAudioContext()
    const source = initSource(ctx, activeSource)

    // Ensure active source gain is at 1
    source.gainNode.gain.cancelScheduledValues(ctx.currentTime)
    source.gainNode.gain.value = 1

    const url = convertFileSrc(filePath)
    source.audio.src = url
    this.currentTrackInfo = extractTrackInfo(filePath)

    try {
      await source.audio.play()
    } catch (err) {
      console.error('[AudioEngine] Playback failed:', err.message)
      throw err
    }
  },

  pause() {
    const audio = getActiveAudio()
    if (audio) {
      audio.pause()
    }
  },

  async resume() {
    const audio = getActiveAudio()
    if (!audio) return
    await ensureAudioContext()
    return audio.play()
  },

  stop() {
    const audio = getActiveAudio()
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    // Also stop any crossfade in progress
    if (isCrossfading) {
      this._cancelCrossfade()
    }
  },

  setVolume(level) {
    const clampedLevel = Math.max(0, Math.min(1, level))
    if (masterGainNode) {
      masterGainNode.gain.value = clampedLevel
    }
  },

  seek(time) {
    const audio = getActiveAudio()
    if (!audio) return
    const clamped = Math.max(0, Math.min(time, this.duration || 0))
    audio.currentTime = clamped
  },

  get currentTime() {
    const audio = getActiveAudio()
    return audio ? audio.currentTime : 0
  },

  get duration() {
    const audio = getActiveAudio()
    return audio && !isNaN(audio.duration) ? audio.duration : 0
  },

  get isPlaying() {
    const audio = getActiveAudio()
    return audio ? !audio.paused && !audio.ended : false
  },

  get isCrossfading() {
    return isCrossfading
  },

  // --- Crossfade methods ---

  async preloadOnInactive(filePath) {
    const ctx = await ensureAudioContext()
    const inactiveKey = getInactiveKey()
    const source = initSource(ctx, inactiveKey)

    // Ensure inactive source gain starts at 0
    source.gainNode.gain.cancelScheduledValues(ctx.currentTime)
    source.gainNode.gain.value = 0

    const url = convertFileSrc(filePath)
    source.audio.preload = 'auto'
    source.audio.src = url
    source.audio.load() // Force reload to avoid stale readyState from previous track

    console.log(`[AudioEngine] Preloading on source ${inactiveKey}: ${filePath}`)

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        source.audio.removeEventListener('canplay', onCanPlay)
        source.audio.removeEventListener('error', onLoadError)
        resolve()
      }
      const onLoadError = (e) => {
        source.audio.removeEventListener('canplay', onCanPlay)
        source.audio.removeEventListener('error', onLoadError)
        reject(e.target.error || new Error('Failed to preload'))
      }
      source.audio.addEventListener('canplay', onCanPlay)
      source.audio.addEventListener('error', onLoadError)
    })
  },

  async startCrossfade(durationMs) {
    const ctx = await ensureAudioContext()
    const durationSec = durationMs / 1000

    const currentKey = activeSource
    const nextKey = getInactiveKey()
    const currentSource = sources[currentKey]
    const nextSource = sources[nextKey]

    if (!nextSource.audio || !nextSource.audio.src) {
      console.warn('[AudioEngine] Cannot crossfade: no track preloaded on inactive source')
      return false
    }

    isCrossfading = true
    console.log(`[AudioEngine] Starting crossfade: ${durationSec}s (${currentKey} → ${nextKey})`)

    if (onCrossfadeStart) onCrossfadeStart()

    // Generate equal-power curves
    const { fadeOut, fadeIn } = generateEqualPowerCurves()

    // Cancel any scheduled values and set current values
    currentSource.gainNode.gain.cancelScheduledValues(ctx.currentTime)
    nextSource.gainNode.gain.cancelScheduledValues(ctx.currentTime)
    currentSource.gainNode.gain.value = 1
    nextSource.gainNode.gain.value = 0

    // Apply crossfade curves
    currentSource.gainNode.gain.setValueCurveAtTime(fadeOut, ctx.currentTime, durationSec)
    nextSource.gainNode.gain.setValueCurveAtTime(fadeIn, ctx.currentTime, durationSec)

    // Start playing the next source
    try {
      await nextSource.audio.play()
    } catch (err) {
      console.error('[AudioEngine] Failed to start next track during crossfade:', err.message)
      isCrossfading = false
      // Reset gains
      currentSource.gainNode.gain.cancelScheduledValues(ctx.currentTime)
      nextSource.gainNode.gain.cancelScheduledValues(ctx.currentTime)
      currentSource.gainNode.gain.value = 1
      nextSource.gainNode.gain.value = 0
      throw err
    }

    // Schedule swap after crossfade completes
    crossfadeTimer = setTimeout(() => {
      this._completeCrossfade(currentKey, nextKey)
    }, durationMs)

    return true
  },

  _completeCrossfade(oldKey, newKey) {
    // Stop old source
    sources[oldKey].audio.pause()
    sources[oldKey].audio.currentTime = 0
    sources[oldKey].gainNode.gain.cancelScheduledValues(audioContext.currentTime)
    sources[oldKey].gainNode.gain.value = 0

    // Ensure new source is at full gain
    sources[newKey].gainNode.gain.cancelScheduledValues(audioContext.currentTime)
    sources[newKey].gainNode.gain.value = 1

    // Swap active source
    activeSource = newKey
    isCrossfading = false
    crossfadeTimer = null

    console.log(`[AudioEngine] Crossfade complete. Active source: ${newKey}`)

    if (onCrossfadeComplete) onCrossfadeComplete()
  },

  _cancelCrossfade() {
    if (crossfadeTimer) {
      clearTimeout(crossfadeTimer)
      crossfadeTimer = null
    }
    if (audioContext) {
      const inactiveKey = getInactiveKey()
      sources[inactiveKey].audio?.pause()
      if (sources[inactiveKey].gainNode) {
        sources[inactiveKey].gainNode.gain.cancelScheduledValues(audioContext.currentTime)
        sources[inactiveKey].gainNode.gain.value = 0
      }
      if (sources[activeSource].gainNode) {
        sources[activeSource].gainNode.gain.cancelScheduledValues(audioContext.currentTime)
        sources[activeSource].gainNode.gain.value = 1
      }
    }
    isCrossfading = false
  },

  // Event setters
  set onTimeUpdate(cb) { onTimeUpdate = cb },
  set onEnded(cb) { onEnded = cb },
  set onError(cb) { onError = cb },
  set onLoadedMetadata(cb) { onLoadedMetadata = cb },
  set onCrossfadeStart(cb) { onCrossfadeStart = cb },
  set onCrossfadeComplete(cb) { onCrossfadeComplete = cb },

  // Expose for testing
  get _audioElement() { return getActiveAudio() },
  get _audioContext() { return audioContext },
  get _gainNode() { return masterGainNode },
  get _sources() { return sources },
  get _activeSource() { return activeSource }
}

export { generateEqualPowerCurves }
export default audioEngine
