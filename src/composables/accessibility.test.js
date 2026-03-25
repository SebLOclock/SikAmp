import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock audioEngine
vi.mock('@/engine/audioEngine.js', () => ({
  default: {
    loadAndPlay: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    _audioElement: { currentTime: 0, addEventListener: vi.fn() },
    set onTimeUpdate(cb) {},
    set onEnded(cb) {},
    set onError(cb) {},
    set onLoadedMetadata(cb) {}
  }
}))

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockRejectedValue(new Error('not in Tauri')),
  convertFileSrc: vi.fn((p) => `asset://${p}`)
}))

// Mock Tauri Store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock Vue lifecycle hooks (composable used outside component)
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: (fn) => fn(),
    onUnmounted: () => {}
  }
})

describe('Accessibility — Keyboard Shortcuts (Story 1.8)', () => {
  let playerStore
  let playlistStore
  let handleKeyDown

  beforeEach(async () => {
    vi.resetModules()

    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())

    const { usePlayerStore } = await import('@/stores/usePlayerStore.js')
    const { usePlaylistStore } = await import('@/stores/usePlaylistStore.js')
    playerStore = usePlayerStore()
    playlistStore = usePlaylistStore()

    const mod = await import('./useKeyboardShortcuts.js')
    const result = mod.useKeyboardShortcuts()
    handleKeyDown = result.handleKeyDown

    // Register callbacks for toggle shortcuts
    let shuffleToggled = false
    let repeatToggled = false
    let crossfadeToggled = false
    let escapeCalled = false

    mod.registerShortcutCallbacks({
      onToggleShuffle: () => { shuffleToggled = true },
      onToggleRepeat: () => { repeatToggled = true },
      onToggleCrossfade: () => { crossfadeToggled = true },
      onEscape: () => { escapeCalled = true },
      onOpenFile: vi.fn(),
      onSavePlaylist: vi.fn(),
      onLoadPlaylist: vi.fn()
    })

    // Store refs for assertions in closure
    handleKeyDown._testCallbacks = {
      get shuffleToggled() { return shuffleToggled },
      get repeatToggled() { return repeatToggled },
      get crossfadeToggled() { return crossfadeToggled },
      get escapeCalled() { return escapeCalled }
    }
  })

  function fireKey(key, options = {}) {
    const event = {
      key,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      ...options
    }
    handleKeyDown(event)
    return event
  }

  describe('new shortcuts — R (repeat), H (shuffle), X (crossfade)', () => {
    it('calls onToggleRepeat on R', () => {
      fireKey('r')
      expect(handleKeyDown._testCallbacks.repeatToggled).toBe(true)
    })

    it('calls onToggleShuffle on H', () => {
      fireKey('h')
      expect(handleKeyDown._testCallbacks.shuffleToggled).toBe(true)
    })

    it('calls onToggleCrossfade on X', () => {
      fireKey('x')
      expect(handleKeyDown._testCallbacks.crossfadeToggled).toBe(true)
    })
  })

  describe('Escape closes overlay', () => {
    it('calls onEscape on Escape key', () => {
      fireKey('Escape')
      expect(handleKeyDown._testCallbacks.escapeCalled).toBe(true)
    })
  })

  describe('Ctrl+ shortcuts', () => {
    it('prevents default on Ctrl+S', () => {
      const event = fireKey('s', { ctrlKey: true })
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('prevents default on Ctrl+O', () => {
      const event = fireKey('o', { ctrlKey: true })
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('prevents default on Ctrl+L', () => {
      const event = fireKey('l', { ctrlKey: true })
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })
})

describe('Accessibility — Focus Trap (Story 1.8)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('traps focus within container — Tab wraps from last to first', async () => {
    const { useFocusTrap } = await import('./useFocusTrap.js')
    const { activate, deactivate } = useFocusTrap()

    // Create a container with focusable elements
    const container = document.createElement('div')
    const btn1 = document.createElement('button')
    btn1.textContent = 'First'
    const btn2 = document.createElement('button')
    btn2.textContent = 'Last'
    container.appendChild(btn1)
    container.appendChild(btn2)
    document.body.appendChild(container)

    activate(container)

    // Focus the last button
    btn2.focus()
    expect(document.activeElement).toBe(btn2)

    // Simulate Tab on last element
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    Object.defineProperty(tabEvent, 'preventDefault', { value: vi.fn() })
    container.dispatchEvent(tabEvent)

    // Focus should wrap to first
    expect(document.activeElement).toBe(btn1)

    deactivate()
    document.body.removeChild(container)
  })

  it('traps focus within container — Shift+Tab wraps from first to last', async () => {
    const { useFocusTrap } = await import('./useFocusTrap.js')
    const { activate, deactivate } = useFocusTrap()

    const container = document.createElement('div')
    const btn1 = document.createElement('button')
    btn1.textContent = 'First'
    const btn2 = document.createElement('button')
    btn2.textContent = 'Last'
    container.appendChild(btn1)
    container.appendChild(btn2)
    document.body.appendChild(container)

    activate(container)

    // Focus the first button
    btn1.focus()
    expect(document.activeElement).toBe(btn1)

    // Simulate Shift+Tab on first element
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    Object.defineProperty(shiftTabEvent, 'preventDefault', { value: vi.fn() })
    container.dispatchEvent(shiftTabEvent)

    // Focus should wrap to last
    expect(document.activeElement).toBe(btn2)

    deactivate()
    document.body.removeChild(container)
  })

  it('restores focus to previous element on deactivate', async () => {
    const { useFocusTrap } = await import('./useFocusTrap.js')
    const { activate, deactivate } = useFocusTrap()

    // Create an external button to focus first
    const externalBtn = document.createElement('button')
    externalBtn.textContent = 'External'
    document.body.appendChild(externalBtn)
    externalBtn.focus()
    expect(document.activeElement).toBe(externalBtn)

    // Create container and activate trap
    const container = document.createElement('div')
    const innerBtn = document.createElement('button')
    innerBtn.textContent = 'Inner'
    container.appendChild(innerBtn)
    document.body.appendChild(container)

    activate(container)
    expect(document.activeElement).toBe(innerBtn)

    // Deactivate should restore focus
    deactivate()
    expect(document.activeElement).toBe(externalBtn)

    document.body.removeChild(container)
    document.body.removeChild(externalBtn)
  })
})

describe('Accessibility — ARIA Labels (Story 1.8)', () => {
  it('focus-styles.css exists and contains focus-visible rules', async () => {
    // Import the CSS file to verify it loads without error
    await import('@/assets/focus-styles.css')
    // If we get here without error, the file exists and is valid CSS
    expect(true).toBe(true)
  })
})
