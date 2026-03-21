import { ref, onMounted, onUnmounted } from 'vue'
import { getCurrentWebview } from '@tauri-apps/api/webview'

export function useFileDrop(onFilesDropped) {
  const isDragging = ref(false)
  let unlisten = null

  onMounted(async () => {
    try {
      const webview = getCurrentWebview()
      unlisten = await webview.onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          isDragging.value = true
        } else if (event.payload.type === 'drop') {
          isDragging.value = false
          const paths = event.payload.paths
          if (paths && paths.length > 0) {
            console.log(`[FileDrop] Dropped ${paths.length} path(s)`)
            onFilesDropped(paths)
          }
        } else if (event.payload.type === 'leave') {
          isDragging.value = false
        }
      })
      console.log('[FileDrop] Drag-and-drop listener registered')
    } catch (err) {
      console.warn('[FileDrop] Failed to register drag-and-drop listener:', err)
    }
  })

  onUnmounted(() => {
    if (unlisten) {
      unlisten()
      unlisten = null
      console.log('[FileDrop] Drag-and-drop listener removed')
    }
  })

  return { isDragging }
}
