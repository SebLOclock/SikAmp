import { onUnmounted } from 'vue'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Simple focus trap composable for overlay panels.
 * Traps Tab within the container and restores focus on deactivate.
 */
export function useFocusTrap() {
  let containerEl = null
  let previouslyFocusedEl = null
  let keydownHandler = null

  function activate(container) {
    if (!container) return
    containerEl = container
    previouslyFocusedEl = document.activeElement

    keydownHandler = (e) => {
      if (e.key !== 'Tab') return

      const focusableElements = containerEl.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusableElements.length === 0) return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    containerEl.addEventListener('keydown', keydownHandler)

    // Focus first focusable element
    const focusableElements = containerEl.querySelectorAll(FOCUSABLE_SELECTOR)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }

  function deactivate() {
    if (containerEl && keydownHandler) {
      containerEl.removeEventListener('keydown', keydownHandler)
    }
    keydownHandler = null
    containerEl = null

    // Restore focus to previous element
    if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === 'function') {
      previouslyFocusedEl.focus()
    }
    previouslyFocusedEl = null
  }

  onUnmounted(() => deactivate())

  return { activate, deactivate }
}
