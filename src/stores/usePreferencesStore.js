import { defineStore } from 'pinia'
import { load } from '@tauri-apps/plugin-store'
import {
  DEFAULT_VOLUME,
  DEFAULT_CROSSFADE_DURATION,
  MAX_CROSSFADE_DURATION
} from '@/utils/constants.js'

const STORE_FILE = 'preferences.json'
const DEBOUNCE_MS = 500

let storePromise = null
const debounceTimers = {}

function getStore() {
  if (!storePromise) {
    storePromise = load(STORE_FILE)
  }
  return storePromise
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    volume: DEFAULT_VOLUME,
    jingleEnabled: true,
    crossfadeEnabled: true,
    crossfadeDuration: DEFAULT_CROSSFADE_DURATION,
    renderMode: 'retro',
    windowState: null,
    scaleFactor: null,
    currentSkinPath: null
  }),

  actions: {
    async loadPreferences() {
      try {
        const s = await getStore()
        const savedVolume = await s.get('volume')
        if (savedVolume !== null && savedVolume !== undefined) {
          this.volume = savedVolume
        }
        const savedJingle = await s.get('jingleEnabled')
        if (savedJingle !== null && savedJingle !== undefined) {
          this.jingleEnabled = savedJingle
        }
        const savedRenderMode = await s.get('renderMode')
        if (savedRenderMode === 'retro' || savedRenderMode === 'modern') {
          this.renderMode = savedRenderMode
        }
        const savedWindowState = await s.get('windowState')
        if (
          savedWindowState &&
          typeof savedWindowState === 'object' &&
          typeof savedWindowState.width === 'number' &&
          typeof savedWindowState.height === 'number' &&
          typeof savedWindowState.x === 'number' &&
          typeof savedWindowState.y === 'number'
        ) {
          this.windowState = savedWindowState
        }
        const savedScaleFactor = await s.get('scaleFactor')
        if (savedScaleFactor === 1 || savedScaleFactor === 2 || savedScaleFactor === 3) {
          this.scaleFactor = savedScaleFactor
        }
        const savedCrossfadeEnabled = await s.get('crossfadeEnabled')
        if (savedCrossfadeEnabled !== null && savedCrossfadeEnabled !== undefined) {
          this.crossfadeEnabled = savedCrossfadeEnabled
        }
        const savedCrossfadeDuration = await s.get('crossfadeDuration')
        if (
          typeof savedCrossfadeDuration === 'number' &&
          savedCrossfadeDuration >= 1 &&
          savedCrossfadeDuration <= MAX_CROSSFADE_DURATION
        ) {
          this.crossfadeDuration = savedCrossfadeDuration
        }
        const savedSkinPath = await s.get('currentSkinPath')
        if (typeof savedSkinPath === 'string' && savedSkinPath.length > 0) {
          this.currentSkinPath = savedSkinPath
        }
        console.log(
          '[PreferencesStore] Loaded preferences — volume:',
          this.volume,
          'jingle:',
          this.jingleEnabled,
          'renderMode:',
          this.renderMode,
          'crossfade:',
          this.crossfadeEnabled,
          'skin:',
          this.currentSkinPath
        )
      } catch (err) {
        console.warn('[PreferencesStore] Failed to load preferences:', err)
      }
    },

    saveVolume(level) {
      this.volume = level
      this._debouncedSave('volume', level)
    },

    setRenderMode(mode) {
      if (mode !== 'retro' && mode !== 'modern') return
      this.renderMode = mode
      this._debouncedSave('renderMode', mode)
    },

    saveWindowState(state) {
      this.windowState = state
      this._debouncedSave('windowState', state)
    },

    setScaleFactor(factor) {
      if (factor !== 1 && factor !== 2 && factor !== 3) return
      this.scaleFactor = factor
      this._debouncedSave('scaleFactor', factor)
    },

    setCrossfadeEnabled(enabled) {
      this.crossfadeEnabled = !!enabled
      console.log('[PreferencesStore] Crossfade toggled:', this.crossfadeEnabled)
      this._debouncedSave('crossfadeEnabled', this.crossfadeEnabled)
    },

    setCrossfadeDuration(seconds) {
      const clamped = Math.max(1, Math.min(MAX_CROSSFADE_DURATION, Math.round(seconds)))
      this.crossfadeDuration = clamped
      this._debouncedSave('crossfadeDuration', clamped)
    },

    setSkinPath(path) {
      this.currentSkinPath = path || null
      this._debouncedSave('currentSkinPath', this.currentSkinPath)
    },

    toggleJingle() {
      this.jingleEnabled = !this.jingleEnabled
      console.log('[PreferencesStore] Jingle toggled:', this.jingleEnabled)
      this._debouncedSave('jingleEnabled', this.jingleEnabled)
    },

    _debouncedSave(key, value) {
      if (debounceTimers[key]) clearTimeout(debounceTimers[key])
      debounceTimers[key] = setTimeout(async () => {
        try {
          const s = await getStore()
          await s.set(key, value)
          await s.save()
        } catch (err) {
          console.warn('[PreferencesStore] Failed to save preference:', err)
        }
      }, DEBOUNCE_MS)
    }
  }
})
