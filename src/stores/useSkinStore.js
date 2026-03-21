import { defineStore } from 'pinia'

// [SkinStore] Image cache — kept outside Pinia state (non-serializable)
const imageCache = new Map()

export const SKIN_COLORS = {
  background: '#29292E',
  displayBg: '#000000',
  textPrimary: '#00FF00',
  textSecondary: '#00CC00',
  playlistText: '#00FF00',
  activeTrack: '#FFFFFF',
  playlistBg: '#000000',
  accentMetallic: '#5A5A5F',
  disabledControls: '#555555',
  error: '#FF4444',
  success: '#44FF44',
  info: '#4488FF',
  lightEdge: '#3F3F44',
  darkEdge: '#1A1A1F'
}

const DEFAULT_ASSETS = {
  main: 'src/assets/default-skin/main.bmp',
  titlebar: 'src/assets/default-skin/titlebar.bmp',
  cbuttons: 'src/assets/default-skin/cbuttons.bmp',
  posbar: 'src/assets/default-skin/posbar.bmp',
  volume: 'src/assets/default-skin/volume.bmp',
  pledit: 'src/assets/default-skin/pledit.bmp',
  text: 'src/assets/default-skin/text.bmp',
  font: 'src/assets/fonts/display-font.bmp'
}

export const useSkinStore = defineStore('skin', {
  state: () => ({
    currentSkin: 'Classic Faithful',
    assets: { ...DEFAULT_ASSETS },
    isLoaded: false,
    renderMode: 'retro'
  }),

  getters: {
    colors: () => SKIN_COLORS
  },

  actions: {
    loadDefaultSkin() {
      console.log('[SkinStore] Loading default skin: Classic Faithful')
      this.currentSkin = 'Classic Faithful'
      this.assets = { ...DEFAULT_ASSETS }
      // For this story, rendering is programmatic — no real images to load
      // The assets paths represent the target structure for future sprite loading
      this.isLoaded = true
      console.log('[SkinStore] Default skin loaded (programmatic rendering mode)')
    },

    getAsset(name) {
      return imageCache.get(name) || null
    },

    setRenderMode(mode) {
      if (mode !== 'retro' && mode !== 'modern') {
        console.warn('[SkinStore] Invalid render mode:', mode)
        return
      }
      console.log('[SkinStore] Render mode changed to:', mode)
      this.renderMode = mode
    }
  }
})
