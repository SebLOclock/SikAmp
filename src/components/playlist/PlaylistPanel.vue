<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useSkinStore } from '@/stores/useSkinStore'

defineProps({
  isDragging: {
    type: Boolean,
    default: false
  }
})

const playlistStore = usePlaylistStore()
const skinStore = useSkinStore()

const focusedIndex = ref(-1)
const dragFromIndex = ref(-1)
const dropTargetIndex = ref(-1)
let mouseDownY = 0
let pendingDragIndex = null
const DRAG_THRESHOLD = 4

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const ariaAnnouncement = ref('')
let previousTrackCount = playlistStore.trackCount

const playlistAriaLabel = computed(() => {
  const count = playlistStore.trackCount
  if (count === 0) return 'Liste de lecture — vide'
  return `Liste de lecture — ${count} morceau${count > 1 ? 'x' : ''}`
})

const activeDescendantId = computed(() => {
  if (focusedIndex.value >= 0 && focusedIndex.value < playlistStore.tracks.length) {
    return `playlist-item-${focusedIndex.value}`
  }
  return undefined
})

watch(() => playlistStore.trackCount, (newCount) => {
  const added = newCount - previousTrackCount
  if (added > 0) {
    ariaAnnouncement.value = `${added} morceau${added > 1 ? 'x' : ''} ajouté${added > 1 ? 's' : ''} à la playlist`
  }
  // Keep focusedIndex in bounds after track list changes
  if (focusedIndex.value >= newCount) {
    focusedIndex.value = newCount - 1
  }
  previousTrackCount = newCount
})

watch(() => playlistStore.isEmpty, (isEmpty, wasEmpty) => {
  if (wasEmpty && !isEmpty) {
    ariaAnnouncement.value = 'Contrôles de lecture activés'
  } else if (!wasEmpty && isEmpty) {
    ariaAnnouncement.value = 'Contrôles de lecture désactivés'
  }
})

function handleDoubleClick(index) {
  playlistStore.playTrack(index)
}

function handleKeyDown(event) {
  const key = event.key
  const trackCount = playlistStore.tracks.length
  if (trackCount === 0) return

  // Alt+Arrow: reorder tracks
  if (event.altKey && (key === 'ArrowDown' || key === 'ArrowUp')) {
    event.preventDefault()
    if (focusedIndex.value < 0) return
    if (key === 'ArrowDown' && focusedIndex.value < trackCount - 1) {
      playlistStore.moveTrack(focusedIndex.value, focusedIndex.value + 1)
      focusedIndex.value++
      ariaAnnouncement.value = `Morceau déplacé en position ${focusedIndex.value + 1}`
    } else if (key === 'ArrowUp' && focusedIndex.value > 0) {
      playlistStore.moveTrack(focusedIndex.value, focusedIndex.value - 1)
      focusedIndex.value--
      ariaAnnouncement.value = `Morceau déplacé en position ${focusedIndex.value + 1}`
    }
    scrollToFocused()
    return
  }

  switch (key) {
    case 'ArrowDown':
      event.preventDefault()
      if (focusedIndex.value < trackCount - 1) {
        focusedIndex.value++
      }
      scrollToFocused()
      break
    case 'ArrowUp':
      event.preventDefault()
      if (focusedIndex.value > 0) {
        focusedIndex.value--
      } else if (focusedIndex.value < 0) {
        focusedIndex.value = 0
      }
      scrollToFocused()
      break
    case 'Enter':
      event.preventDefault()
      if (focusedIndex.value >= 0) {
        playlistStore.playTrack(focusedIndex.value)
      }
      break
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      if (focusedIndex.value >= 0) {
        const removeIdx = focusedIndex.value
        playlistStore.removeTrack(removeIdx)
        if (focusedIndex.value >= playlistStore.tracks.length) {
          focusedIndex.value = playlistStore.tracks.length - 1
        }
      }
      break
    case 'Home':
      event.preventDefault()
      focusedIndex.value = 0
      scrollToFocused()
      break
    case 'End':
      event.preventDefault()
      focusedIndex.value = trackCount - 1
      scrollToFocused()
      break
  }
}

function scrollToFocused() {
  const el = document.getElementById(`playlist-item-${focusedIndex.value}`)
  if (el) el.scrollIntoView({ block: 'nearest' })
}

function handleFocus() {
  if (focusedIndex.value < 0 && playlistStore.tracks.length > 0) {
    focusedIndex.value = playlistStore.currentIndex >= 0 ? playlistStore.currentIndex : 0
  }
}

// Mouse-based reordering (HTML5 DnD doesn't work in Tauri webview)
function handleMouseDown(event, index) {
  // Only left click, ignore if modifier keys (for text selection etc.)
  if (event.button !== 0 || event.ctrlKey || event.metaKey) return
  mouseDownY = event.clientY
  pendingDragIndex = index
}

function handleMouseMove(event) {
  if (pendingDragIndex === null) return
  // Start drag only after threshold
  if (dragFromIndex.value < 0) {
    if (Math.abs(event.clientY - mouseDownY) < DRAG_THRESHOLD) return
    dragFromIndex.value = pendingDragIndex
    document.body.style.cursor = 'grabbing'
    document.addEventListener('mouseup', handleGlobalMouseUp)
  }
  // Find which track the cursor is over
  const tracksContainer = event.currentTarget
  const children = tracksContainer.children
  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect()
    if (event.clientY >= rect.top && event.clientY < rect.bottom) {
      dropTargetIndex.value = i
      return
    }
  }
}

function handleMouseUp() {
  if (dragFromIndex.value >= 0 && dropTargetIndex.value >= 0 && dragFromIndex.value !== dropTargetIndex.value) {
    playlistStore.moveTrack(dragFromIndex.value, dropTargetIndex.value)
    focusedIndex.value = dropTargetIndex.value
  }
  cleanupDrag()
}

function handleGlobalMouseUp() {
  cleanupDrag()
}

function cleanupDrag() {
  dragFromIndex.value = -1
  dropTargetIndex.value = -1
  pendingDragIndex = null
  document.body.style.cursor = ''
  document.removeEventListener('mouseup', handleGlobalMouseUp)
}

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleGlobalMouseUp)
})

function trackAriaLabel(track, index) {
  const num = index + 1
  const artist = track.artist && track.artist !== 'Inconnu' ? track.artist : ''
  const duration = formatDuration(track.duration)
  const parts = [`${num}. ${track.title}`]
  if (artist) parts.push(artist)
  parts.push(duration)
  return parts.join(' — ')
}
</script>

<template>
  <div
    class="playlist-panel"
    role="listbox"
    :aria-label="playlistAriaLabel"
    :aria-activedescendant="activeDescendantId"
    tabindex="0"
    :style="{
      backgroundColor: skinStore.colors.playlistBg,
      color: skinStore.colors.playlistText
    }"
    @keydown="handleKeyDown"
    @focus="handleFocus"
  >
    <!-- Drag overlay -->
    <div
      v-if="isDragging"
      class="drag-overlay"
      :style="{ borderColor: skinStore.colors.activeTrack || '#00FF00' }"
    >
      <span class="drag-overlay-text">Dépose tes fichiers ici</span>
    </div>

    <!-- Header -->
    <div class="playlist-header">
      <span class="col-number">#</span>
      <span class="col-title">Titre</span>
      <span class="col-artist">Artiste</span>
      <span class="col-duration">Durée</span>
    </div>

    <!-- Track list -->
    <div
      v-if="!playlistStore.isEmpty"
      class="playlist-tracks"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    >
      <div
        v-for="(track, index) in playlistStore.tracks"
        :id="`playlist-item-${index}`"
        :key="`${track.path}-${index}`"
        class="playlist-track"
        role="option"
        :aria-selected="index === playlistStore.currentIndex"
        :aria-current="index === playlistStore.currentIndex ? 'true' : undefined"
        :aria-label="trackAriaLabel(track, index)"
        :class="{
          'is-active': index === playlistStore.currentIndex,
          'is-focused': index === focusedIndex,
          'drop-target': index === dropTargetIndex && dragFromIndex !== index,
          'is-dragging': index === dragFromIndex
        }"
        :style="{
          color: index === playlistStore.currentIndex ? skinStore.colors.activeTrack : skinStore.colors.playlistText,
          borderTopColor: (index === dropTargetIndex && dragFromIndex !== index) ? skinStore.colors.activeTrack : 'transparent'
        }"
        @dblclick="handleDoubleClick(index)"
        @mousedown="handleMouseDown($event, index)"
      >
        <span class="col-number">{{ index + 1 }}</span>
        <span class="col-title">{{ track.title }}</span>
        <span class="col-artist">{{ track.artist }}</span>
        <span class="col-duration">{{ formatDuration(track.duration) }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="playlist-empty" aria-label="Zone de dépôt de fichiers">
      <div class="empty-icon">🎵</div>
      <div>Glisse ta musique ici</div>
    </div>

    <!-- Status bar -->
    <div v-if="!playlistStore.isEmpty" class="playlist-status">
      {{ playlistStore.trackCount }} morceau{{ playlistStore.trackCount > 1 ? 'x' : '' }}
    </div>

    <!-- ARIA live region for announcements -->
    <div aria-live="polite" class="sr-only" role="status">{{ ariaAnnouncement }}</div>
  </div>
</template>

<style scoped>
.playlist-panel {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  border-top: 1px solid #3F3F44;
  position: relative;
}

.drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 255, 0, 0.08);
  border: 2px solid;
  pointer-events: none;
  transition: opacity 0.05s ease;
}

.drag-overlay-text {
  color: #00FF00;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
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

.playlist-track.is-focused {
  background-color: rgba(0, 255, 0, 0.1);
  outline: 1px dashed #00FF00;
  outline-offset: -1px;
}

.playlist-track.is-active {
  font-weight: bold;
}

.playlist-track {
  border-top: 2px solid transparent;
}

.playlist-track.is-dragging {
  opacity: 0.4;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  gap: 4px;
  color: #555;
  font-style: italic;
  font-size: 13px;
}

.empty-icon {
  font-size: 24px;
  font-style: normal;
}

.playlist-status {
  padding: 2px 8px;
  border-top: 1px solid #333;
  color: #888;
  font-size: 10px;
  text-align: right;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
