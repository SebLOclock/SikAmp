<script setup>
import { onMounted } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useFileDrop } from '@/composables/useFileDrop'
import PlayerDisplay from '@/components/player/PlayerDisplay.vue'
import SeekBar from '@/components/player/SeekBar.vue'
import TransportControls from '@/components/player/TransportControls.vue'
import VolumeSlider from '@/components/player/VolumeSlider.vue'
import ActionBar from '@/components/player/ActionBar.vue'
import PlaylistPanel from '@/components/playlist/PlaylistPanel.vue'

const skinStore = useSkinStore()
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
useKeyboardShortcuts()

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
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }
}

async function handleFilesDropped(paths) {
  if (isProcessingDrop) return
  isProcessingDrop = true
  try {
    const { processDroppedPaths } = await import('@/utils/fileDropProcessor.js')
    const wasEmpty = playlistStore.isEmpty
    const { directFiles, resolvedFiles } = await processDroppedPaths(paths)

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

function handlePrev() {
  playlistStore.playPrevious()
}

function handleNext() {
  playlistStore.playNext()
}

onMounted(() => {
  skinStore.loadDefaultSkin()
  playlistStore.init()
  playerStore.restoreVolume()
})
</script>

<template>
  <main class="app" :style="{ backgroundColor: skinStore.colors.background }">
    <div class="player-window">
      <PlayerDisplay />
      <SeekBar />
      <div class="controls-row">
        <TransportControls @prev="handlePrev" @next="handleNext" />
        <VolumeSlider />
      </div>
      <ActionBar />
    </div>
    <PlaylistPanel :is-dragging="isDragging" />
  </main>
</template>

<style>
:root {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
  color: #00FF00;
  background-color: #29292E;
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
  min-height: 100vh;
}

.player-window {
  display: flex;
  flex-direction: column;
  width: 100%;
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
