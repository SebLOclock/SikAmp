import { usePreferencesStore } from '@/stores/usePreferencesStore'
import jingleUrl from '@/assets/jingle.mp3'

const JINGLE_VOLUME = 0.7

export function useJingle() {
  const preferencesStore = usePreferencesStore()

  async function playJingle() {
    if (!preferencesStore.jingleEnabled) {
      return
    }

    try {
      const audio = new Audio(jingleUrl)
      audio.volume = JINGLE_VOLUME
      await audio.play()
      console.log('[Jingle] Playing startup jingle')
    } catch (err) {
      // Silently fail — jingle is cosmetic, not critical
      console.warn('[Jingle] Could not play jingle:', err.message)
    }
  }

  return { playJingle }
}
