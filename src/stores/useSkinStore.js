import { defineStore } from 'pinia'
import { invoke, convertFileSrc } from '@tauri-apps/api/core'

// [SkinStore] Image cache — kept outside Pinia state (non-serializable)
const imageCache = new Map()

// Guard against concurrent loadSkinFromWsz calls
let loadGeneration = 0

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

// Default colors (constant reference for reset)
const DEFAULT_COLORS = { ...SKIN_COLORS }

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

// Map .wsz file names to asset keys (case-insensitive)
const WSZ_FILE_MAP = {
  'main.bmp': 'main',
  'titlebar.bmp': 'titlebar',
  'cbuttons.bmp': 'cbuttons',
  'posbar.bmp': 'posbar',
  'volume.bmp': 'volume',
  'pledit.bmp': 'pledit',
  'text.bmp': 'text',
  'numbers.bmp': 'numbers',
  'playpaus.bmp': 'playpaus',
  'shufrep.bmp': 'shufrep',
  'monoster.bmp': 'monoster',
  'balance.bmp': 'balance',
  'eqmain.bmp': 'eqmain',
  'eq_ex.bmp': 'eq_ex',
  'mb.bmp': 'mb'
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Parse pledit.txt (INI-like format) for playlist colors.
 * Format:
 *   [Text]
 *   Normal=#003366
 *   Current=#008080
 *   NormalBG=#FFFFFF
 *   SelectedBG=#AECFD2
 *   Font=Arial
 */
function parsePledit(text) {
  const colors = {}
  const lines = text.trim().split('\n')
  for (const line of lines) {
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    if (!/^#[0-9A-Fa-f]{3,6}$/.test(value)) continue
    switch (key) {
      case 'Normal':
        colors.playlistText = value
        break
      case 'Current':
        colors.activeTrack = value
        break
      case 'NormalBG':
        colors.playlistBg = value
        break
      case 'SelectedBG':
        colors.selectedBg = value
        break
    }
  }
  return colors
}

export const useSkinStore = defineStore('skin', {
  state: () => ({
    currentSkin: 'Classic Faithful',
    currentSkinPath: null,
    assets: { ...DEFAULT_ASSETS },
    isLoaded: false,
    isCustomSkin: false,
    renderMode: 'retro',
    skinColors: { ...DEFAULT_COLORS },
    mainBmpUrl: null, // asset:// URL for main.bmp, used as CSS background on player-window
    skinVersion: 0 // incremented on each skin change to trigger watchers
  }),

  getters: {
    colors: (state) => state.skinColors
  },

  actions: {
    loadDefaultSkin() {
      console.log('[SkinStore] Loading default skin: Classic Faithful')
      imageCache.clear()
      this.currentSkin = 'Classic Faithful'
      this.currentSkinPath = null
      this.assets = { ...DEFAULT_ASSETS }
      this.isCustomSkin = false
      this.skinColors = { ...DEFAULT_COLORS }
      this.mainBmpUrl = null
      this.isLoaded = true
      this.skinVersion++
      console.log('[SkinStore] Default skin loaded (programmatic rendering mode)')
    },

    async loadSkinFromWsz(wszPath) {
      console.log('[SkinStore] Loading skin from:', wszPath)
      const thisGeneration = ++loadGeneration

      const result = await invoke('parse_skin', { wszPath })
      if (thisGeneration !== loadGeneration) return // superseded by newer load
      const { skinName, extractDir, files } = result

      // Load images for mapped assets
      const newCache = new Map()
      const loadPromises = []
      let pendingMainBmpUrl = null
      let pendingColors = null

      for (const file of files) {
        const baseName = file.split('/').pop().toLowerCase()
        const assetKey = WSZ_FILE_MAP[baseName]

        if (assetKey) {
          const fullPath = `${extractDir}/${file}`
          const assetUrl = convertFileSrc(fullPath)
          if (assetKey === 'main') {
            pendingMainBmpUrl = assetUrl
          }
          loadPromises.push(
            loadImage(assetUrl)
              .then((img) => {
                newCache.set(assetKey, img)
                console.log(`[SkinStore] Loaded asset: ${assetKey} from ${baseName}`)
              })
              .catch((err) => {
                console.warn(`[SkinStore] Failed to load asset ${assetKey}: ${err.message}`)
                // Fallback: keep default (no image in cache = programmatic rendering)
              })
          )
        }

        // Parse pledit.txt for playlist colors (the real UI color source in .wsz skins)
        if (baseName === 'pledit.txt') {
          const fullPath = `${extractDir}/${file}`
          loadPromises.push(
            fetch(convertFileSrc(fullPath))
              .then((r) => r.text())
              .then((text) => {
                const parsed = parsePledit(text)
                if (Object.keys(parsed).length > 0) {
                  pendingColors = { ...DEFAULT_COLORS, ...parsed }
                  console.log('[SkinStore] Loaded pledit palette:', Object.keys(parsed))
                }
              })
              .catch((err) => {
                console.warn('[SkinStore] Failed to parse pledit.txt:', err.message)
              })
          )
        }
      }

      await Promise.all(loadPromises)

      // Check again after async work — another load may have started
      if (thisGeneration !== loadGeneration) return

      // Apply the new skin atomically
      imageCache.clear()
      for (const [key, img] of newCache) {
        imageCache.set(key, img)
      }

      this.currentSkin = skinName
      this.currentSkinPath = wszPath
      this.isCustomSkin = true
      this.mainBmpUrl = pendingMainBmpUrl
      this.skinColors = pendingColors || { ...DEFAULT_COLORS }
      this.isLoaded = true
      this.skinVersion++
      console.log(`[SkinStore] Skin "${skinName}" applied with ${imageCache.size} sprites`)
    },

    resetToDefaultSkin() {
      console.log('[SkinStore] Resetting to default skin')
      this.loadDefaultSkin()
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
