import { getCurrentWindow, availableMonitors } from '@tauri-apps/api/window'
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/dpi'
import { usePreferencesStore } from '@/stores/usePreferencesStore'

export function useWindowState() {
  const preferencesStore = usePreferencesStore()
  let unlistenResize = null
  let unlistenMove = null

  async function captureLogicalState(win) {
    const factor = await win.scaleFactor()
    const physSize = await win.innerSize()
    const physPos = await win.outerPosition()
    return {
      width: Math.round(physSize.width / factor),
      height: Math.round(physSize.height / factor),
      x: Math.round(physPos.x / factor),
      y: Math.round(physPos.y / factor)
    }
  }

  async function listenToChanges() {
    try {
      const win = getCurrentWindow()

      unlistenResize = await win.onResized(async () => {
        const state = await captureLogicalState(win)
        preferencesStore.saveWindowState(state)
      })

      unlistenMove = await win.onMoved(async () => {
        const state = await captureLogicalState(win)
        preferencesStore.saveWindowState(state)
      })

      console.log('[WindowState] Listening to resize/move events')
    } catch (err) {
      console.warn('[WindowState] Failed to register window listeners:', err)
    }
  }

  async function restoreState() {
    const state = preferencesStore.windowState
    if (!state) return

    try {
      const win = getCurrentWindow()

      // Validate that saved position is visible on at least one monitor
      const monitors = await availableMonitors()
      const isVisible = monitors.some((m) => {
        const mx = m.position.x
        const my = m.position.y
        const mw = m.size.width / m.scaleFactor
        const mh = m.size.height / m.scaleFactor
        return state.x + 100 > mx && state.x < mx + mw &&
               state.y + 50 > my && state.y < my + mh
      })

      await win.setSize(new LogicalSize(state.width, state.height))
      if (isVisible) {
        await win.setPosition(new LogicalPosition(state.x, state.y))
      } else {
        console.log('[WindowState] Saved position is off-screen, using default position')
      }
      console.log('[WindowState] Restored window state:', state)
    } catch (err) {
      console.warn('[WindowState] Failed to restore window state:', err)
    }
  }

  function destroy() {
    if (unlistenResize) unlistenResize()
    if (unlistenMove) unlistenMove()
  }

  return { restoreState, listenToChanges, destroy }
}
