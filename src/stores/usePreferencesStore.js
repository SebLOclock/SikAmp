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
    jingleEnabled: true
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
        console.log('[PreferencesStore] Loaded preferences — volume:', this.volume, 'jingle:', this.jingleEnabled)
      } catch (err) {
        console.warn('[PreferencesStore] Failed to load preferences:', err)
      }
    },

    saveVolume(level) {
      this.volume = level
      this._debouncedSave('volume', level)
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
