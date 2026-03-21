import { defineStore } from 'pinia'
import { load } from '@tauri-apps/plugin-store'
import { DEFAULT_VOLUME } from '@/utils/constants.js'

const STORE_FILE = 'preferences.json'
const DEBOUNCE_MS = 500

let storePromise = null
let debounceTimer = null

function getStore() {
  if (!storePromise) {
    storePromise = load(STORE_FILE)
  }
  return storePromise
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    volume: DEFAULT_VOLUME
  }),

  actions: {
    async loadPreferences() {
      try {
        const s = await getStore()
        const savedVolume = await s.get('volume')
        if (savedVolume !== null && savedVolume !== undefined) {
          this.volume = savedVolume
        }
        console.log('[PreferencesStore] Loaded volume:', this.volume)
      } catch (err) {
        console.warn('[PreferencesStore] Failed to load preferences:', err)
      }
    },

    saveVolume(level) {
      this.volume = level
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        try {
          const s = await getStore()
          await s.set('volume', level)
          await s.save()
        } catch (err) {
          console.warn('[PreferencesStore] Failed to save volume:', err)
        }
      }, DEBOUNCE_MS)
    }
  }
})
