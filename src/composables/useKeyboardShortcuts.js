import { onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'

const SEEK_STEP = 5
const VOLUME_STEP = 0.05

function isInputFocused() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable) return true
  const role = el.getAttribute('role')
  return role === 'listbox' || role === 'menu' || role === 'tree'
}

// Callbacks for panel and file actions (set by App.vue)
let onEscape = null
let onOpenFile = null
let onSavePlaylist = null
let onLoadPlaylist = null
let onToggleShuffle = null
let onToggleRepeat = null
let onToggleCrossfade = null
let onNewPlaylist = null

export function useKeyboardShortcuts() {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()
  let volumeBeforeMute = playerStore.volume || 0.75

  function handleKeyDown(event) {
    if (isInputFocused()) return

    const key = event.key.toLowerCase()

    // Playback shortcuts are disabled when playlist is empty
    const playbackDisabled = playlistStore.isEmpty

    // Handle Ctrl+ shortcuts first
    if (event.ctrlKey || event.metaKey) {
      switch (key) {
        case 's':
          event.preventDefault()
          if (onSavePlaylist) onSavePlaylist()
          return
        case 'o':
          event.preventDefault()
          if (onOpenFile) onOpenFile()
          return
        case 'l':
          event.preventDefault()
          if (onLoadPlaylist) onLoadPlaylist()
          return
        case 'n':
          event.preventDefault()
          if (onNewPlaylist) onNewPlaylist()
          return
        case 't':
          event.preventDefault()
          if (onToggleCrossfade) onToggleCrossfade()
          return
        default:
          break
      }
    }

    switch (key) {
      case ' ':
        event.preventDefault()
        if (playbackDisabled) break
        if (playerStore.isPlaying) {
          playerStore.pause()
        } else if (playerStore.isPaused) {
          playerStore.resume()
        } else if (playlistStore.currentTrack) {
          playerStore.play(playlistStore.currentTrack.path)
        }
        break

      case 's':
        if (playbackDisabled) break
        playerStore.stop()
        break

      case 'n':
        if (playbackDisabled) break
        playlistStore.playNext()
        break

      case 'p':
        if (playbackDisabled) break
        playlistStore.playPrevious()
        break

      case 'r':
        if (onToggleRepeat) onToggleRepeat()
        break

      case 'h':
        if (onToggleShuffle) onToggleShuffle()
        break

      case 'x':
        if (onToggleCrossfade) onToggleCrossfade()
        break

      case 'escape':
        if (onEscape) onEscape()
        break

      case 'arrowright':
        event.preventDefault()
        if (playbackDisabled) break
        if (playerStore.duration > 0) {
          playerStore.seek(Math.min(playerStore.currentTime + SEEK_STEP, playerStore.duration))
        }
        break

      case 'arrowleft':
        event.preventDefault()
        if (playbackDisabled) break
        if (playerStore.duration > 0) {
          playerStore.seek(Math.max(playerStore.currentTime - SEEK_STEP, 0))
        }
        break

      case 'arrowup':
        event.preventDefault()
        playerStore.setVolume(playerStore.volume + VOLUME_STEP)
        break

      case 'arrowdown':
        event.preventDefault()
        playerStore.setVolume(playerStore.volume - VOLUME_STEP)
        break

      case 'm':
        if (playerStore.volume > 0) {
          volumeBeforeMute = playerStore.volume
          playerStore.setVolume(0)
        } else {
          playerStore.setVolume(volumeBeforeMute)
        }
        break

      default:
        return // don't prevent default for unhandled keys
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return { handleKeyDown }
}

// Register callback functions from App.vue
export function registerShortcutCallbacks(callbacks) {
  if (callbacks.onEscape) onEscape = callbacks.onEscape
  if (callbacks.onOpenFile) onOpenFile = callbacks.onOpenFile
  if (callbacks.onSavePlaylist) onSavePlaylist = callbacks.onSavePlaylist
  if (callbacks.onLoadPlaylist) onLoadPlaylist = callbacks.onLoadPlaylist
  if (callbacks.onToggleShuffle) onToggleShuffle = callbacks.onToggleShuffle
  if (callbacks.onToggleRepeat) onToggleRepeat = callbacks.onToggleRepeat
  if (callbacks.onToggleCrossfade) onToggleCrossfade = callbacks.onToggleCrossfade
  if (callbacks.onNewPlaylist) onNewPlaylist = callbacks.onNewPlaylist
}
