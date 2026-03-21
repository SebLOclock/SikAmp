<script setup>
import { onMounted } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import PlayerDisplay from '@/components/player/PlayerDisplay.vue'
import SeekBar from '@/components/player/SeekBar.vue'
import TransportControls from '@/components/player/TransportControls.vue'
import VolumeSlider from '@/components/player/VolumeSlider.vue'
import ActionBar from '@/components/player/ActionBar.vue'
import PlaylistPanel from '@/components/playlist/PlaylistPanel.vue'

const skinStore = useSkinStore()
const playlistStore = usePlaylistStore()

function handlePrev() {
  playlistStore.playPrevious()
}

function handleNext() {
  playlistStore.playNext()
}

onMounted(() => {
  skinStore.loadDefaultSkin()
  playlistStore.init()
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
    <PlaylistPanel />
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
