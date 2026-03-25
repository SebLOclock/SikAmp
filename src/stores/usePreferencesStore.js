import { defineStore } from 'pinia'
import { load } from '@tauri-apps/plugin-store'
import { DEFAULT_VOLUME } from '@/utils/constants.js'

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
    renderMode: 'retro',
    windowState: null,
    scaleFactor: null
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
        if (savedWindowState && typeof savedWindowState === 'object' &&
            typeof savedWindowState.width === 'number' && typeof savedWindowState.height === 'number' &&
            typeof savedWindowState.x === 'number' && typeof savedWindowState.y === 'number') {
          this.windowState = savedWindowState
        }
        const savedScaleFactor = await s.get('scaleFactor')
        if (savedScaleFactor === 1 || savedScaleFactor === 2 || savedScaleFactor === 3) {
          this.scaleFactor = savedScaleFactor
        }
        console.log('[PreferencesStore] Loaded preferences — volume:', this.volume, 'jingle:', this.jingleEnabled, 'renderMode:', this.renderMode)
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
