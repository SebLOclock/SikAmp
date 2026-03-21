<script setup>
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useSkinStore } from '@/stores/useSkinStore'

const playlistStore = usePlaylistStore()
const skinStore = useSkinStore()

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleDoubleClick(index) {
  playlistStore.playTrack(index)
}
</script>

<template>
  <div
    class="playlist-panel"
    role="listbox"
    aria-label="Playlist"
    :style="{
      backgroundColor: skinStore.colors.playlistBg,
      color: skinStore.colors.playlistText
    }"
  >
    <!-- Header -->
    <div class="playlist-header">
      <span class="col-number">#</span>
      <span class="col-title">Titre</span>
      <span class="col-artist">Artiste</span>
      <span class="col-duration">Durée</span>
    </div>

    <!-- Track list -->
    <div v-if="!playlistStore.isEmpty" class="playlist-tracks">
      <div
        v-for="(track, index) in playlistStore.tracks"
        :key="index"
        class="playlist-track"
        role="option"
        :aria-selected="index === playlistStore.currentIndex"
        :class="{ 'is-active': index === playlistStore.currentIndex }"
        :style="{
          color: index === playlistStore.currentIndex ? skinStore.colors.activeTrack : skinStore.colors.playlistText
        }"
        @dblclick="handleDoubleClick(index)"
      >
        <span class="col-number">{{ index + 1 }}</span>
        <span class="col-title">{{ track.title }}</span>
        <span class="col-artist">{{ track.artist }}</span>
        <span class="col-duration">{{ formatDuration(track.duration) }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="playlist-empty">
      Glisse ta musique ici
    </div>
  </div>
</template>

<style scoped>
.playlist-panel {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  min-height: 120px;
  max-height: 300px;
  overflow-y: auto;
  border-top: 1px solid #3F3F44;
}

.playlist-header {
  display: flex;
  padding: 4px 8px;
  border-bottom: 1px solid #333;
  color: #00CC00;
  font-weight: bold;
  position: sticky;
  top: 0;
  background-color: #111;
}

.playlist-tracks {
  padding: 2px 0;
}

.playlist-track {
  display: flex;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
}

.playlist-track:hover {
  background-color: rgba(0, 255, 0, 0.05);
}

.playlist-track.is-active {
  font-weight: bold;
}

.col-number {
  width: 30px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 8px;
}

.col-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-artist {
  width: 120px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 8px;
}

.col-duration {
  width: 50px;
  flex-shrink: 0;
  text-align: right;
}

.playlist-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  color: #555;
  font-style: italic;
  font-size: 13px;
}
</style>
