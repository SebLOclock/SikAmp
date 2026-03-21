import { onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'

const SEEK_STEP = 5
const VOLUME_STEP = 0.05

function isInputFocused() {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable
}

export function useKeyboardShortcuts() {
  const playerStore = usePlayerStore()
  const playlistStore = usePlaylistStore()
  let volumeBeforeMute = playerStore.volume || 0.75

  function handleKeyDown(event) {
    if (isInputFocused()) return

    const key = event.key.toLowerCase()

    // Playback shortcuts are disabled when playlist is empty
    const playbackDisabled = playlistStore.isEmpty

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
