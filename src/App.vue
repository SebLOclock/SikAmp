<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useKeyboardShortcuts, registerShortcutCallbacks } from '@/composables/useKeyboardShortcuts'
import { useFileDrop } from '@/composables/useFileDrop'
import { useJingle } from '@/composables/useJingle'
import { useWindowState } from '@/composables/useWindowState'
import '@/assets/focus-styles.css'
import PlayerDisplay from '@/components/player/PlayerDisplay.vue'
import SeekBar from '@/components/player/SeekBar.vue'
import TransportControls from '@/components/player/TransportControls.vue'
import VolumeSlider from '@/components/player/VolumeSlider.vue'
import ActionBar from '@/components/player/ActionBar.vue'
import PlaylistPanel from '@/components/playlist/PlaylistPanel.vue'
import PreferencesPanel from '@/components/shared/PreferencesPanel.vue'
import SkinSelector from '@/components/skin/SkinSelector.vue'

const activeOverlay = ref(null) // null | 'preferences' | 'skins'
const actionBarRef = ref(null)
const skinStore = useSkinStore()
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const preferencesStore = usePreferencesStore()
const { playJingle } = useJingle()
const {
  restoreState: restoreWindowState,
  listenToChanges: listenWindowChanges,
  destroy: destroyWindowListeners
} = useWindowState()
useKeyboardShortcuts()

function toggleOverlay(name) {
  activeOverlay.value = activeOverlay.value === name ? null : name
}

function closeOverlay() {
  activeOverlay.value = null
}

registerShortcutCallbacks({
  onEscape: () => {
    closeOverlay()
  },
  onToggleShuffle: () => {
    actionBarRef.value?.executeAction('shuffle')
    actionBarRef.value?.draw?.()
  },
  onToggleRepeat: () => {
    actionBarRef.value?.executeAction('repeat')
    actionBarRef.value?.draw?.()
  },
  onToggleCrossfade: () => {
    actionBarRef.value?.executeAction('crossfade')
    actionBarRef.value?.draw?.()
  },
  onOpenFile: () => {
    playlistStore.openFiles()
  },
  onSavePlaylist: () => {
    playlistStore.savePlaylist()
  },
  onLoadPlaylist: () => {
    playlistStore.loadPlaylist()
  },
  onNewPlaylist: () => {
    playlistStore.newPlaylist()
  }
})

const { isDragging } = useFileDrop(handleFilesDropped)

const BATCH_SIZE = 50
let isProcessingDrop = false

async function addTracksInBatches(paths, autoPlay) {
  if (paths.length <= BATCH_SIZE) {
    playlistStore.addTracks(paths)
    if (autoPlay) playlistStore.playTrack(0)
    return
  }
  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE)
    playlistStore.addTracks(batch)
    if (i === 0 && autoPlay) {
      playlistStore.playTrack(0)
    }
    if (i + BATCH_SIZE < paths.length) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }
}

async function handleFilesDropped(paths) {
  if (isProcessingDrop) return
  isProcessingDrop = true
  try {
    const { processDroppedPaths } = await import('@/utils/fileDropProcessor.js')
    const wasEmpty = playlistStore.isEmpty
    const { directFiles, resolvedFiles, wszFiles } = await processDroppedPaths(paths)

    // Handle .wsz skin files
    if (wszFiles.length > 0) {
      await handleWszDrop(wszFiles[0])
    }

    // Add direct audio files first for instant feedback
    if (directFiles.length > 0) {
      await addTracksInBatches(directFiles, wasEmpty)
    }

    // Then add files resolved from directories
    if (resolvedFiles.length > 0) {
      const autoPlay = wasEmpty && directFiles.length === 0
      await addTracksInBatches(resolvedFiles, autoPlay)
    }
  } finally {
    isProcessingDrop = false
  }
}

async function handleWszDrop(wszPath) {
  // Step 1: Parse and apply the skin
  try {
    await skinStore.loadSkinFromWsz(wszPath)
  } catch (err) {
    console.warn('[App] Failed to load skin:', err)
    playerStore.showFeedback(`Skin invalide : ${wszPath.split('/').pop()}`, 'error')
    skinStore.resetToDefaultSkin()
    return
  }

  // Step 2: Copy to library and persist (skin already applied — don't reset on failure)
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const libraryPath = await invoke('copy_skin_to_library', { wszPath })
    preferencesStore.setSkinPath(libraryPath)
    console.log('[App] Skin applied and saved to library:', libraryPath)
  } catch (err) {
    // Skin is applied but library copy failed — persist original path as fallback
    console.warn('[App] Failed to copy skin to library:', err)
    preferencesStore.setSkinPath(wszPath)
  }
}

const renderModeClass = computed(() =>
  skinStore.renderMode === 'modern' ? 'render-modern' : 'render-retro'
)

const playerWindowStyle = computed(() => {
  if (skinStore.mainBmpUrl) {
    return {
      backgroundImage: `url(${skinStore.mainBmpUrl})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat'
    }
  }
  return {}
})

function handlePrev() {
  playlistStore.playPrevious()
}

function handleNext() {
  playlistStore.playNext()
}

onMounted(() => {
  // Start UI init immediately (no blocking), load prefs + jingle in parallel
  skinStore.loadDefaultSkin()
  playlistStore.init()
  playerStore.restoreVolume()
  preferencesStore.loadPreferences().then(async () => {
    // Apply saved render mode to skin store
    skinStore.setRenderMode(preferencesStore.renderMode)
    // Load saved skin if any
    if (preferencesStore.currentSkinPath) {
      try {
        await skinStore.loadSkinFromWsz(preferencesStore.currentSkinPath)
        console.log('[App] Restored saved skin:', preferencesStore.currentSkinPath)
      } catch (err) {
        // .wsz file no longer exists or is invalid, fallback silently
        console.log('[App] Saved skin not found or invalid, using default:', err)
        preferencesStore.setSkinPath(null)
      }
    }
    // Auto-detect scale factor if not already saved
    if (preferencesStore.scaleFactor === null) {
      const dpr = window.devicePixelRatio || 1
      const scale = dpr >= 3 ? 3 : dpr >= 2 ? 2 : 1
      preferencesStore.setScaleFactor(scale)
    }
    // Restore window size/position then listen for changes
    await restoreWindowState()
    listenWindowChanges()
    playJingle()
  })
})

onUnmounted(() => {
  destroyWindowListeners()
})
</script>

<template>
  <main
    class="app"
    :class="renderModeClass"
    :style="{ backgroundColor: skinStore.colors.background }"
  >
    <div class="player-window" :style="playerWindowStyle">
      <PlayerDisplay />
      <SeekBar />
      <div class="controls-row">
        <TransportControls @prev="handlePrev" @next="handleNext" />
        <VolumeSlider />
      </div>
      <ActionBar
        ref="actionBarRef"
        @prefs="toggleOverlay('preferences')"
        @skins="toggleOverlay('skins')"
      />
    </div>
    <PlaylistPanel :is-dragging="isDragging" />
    <PreferencesPanel :visible="activeOverlay === 'preferences'" @close="closeOverlay" />
    <SkinSelector :visible="activeOverlay === 'skins'" @close="closeOverlay" />
  </main>
</template>

<style>
:root {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
  color: #00ff00;
  background-color: #29292e;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

<style scoped>
.app {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.player-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-shrink: 0;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.controls-row > :first-child {
  flex: 1;
}

.controls-row > :last-child {
  flex-shrink: 0;
}
</style>
