import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockWindow = {
  innerSize: vi.fn().mockResolvedValue({ width: 1600, height: 1200 }),
  outerPosition: vi.fn().mockResolvedValue({ x: 200, y: 200 }),
  scaleFactor: vi.fn().mockResolvedValue(2),
  setSize: vi.fn().mockResolvedValue(undefined),
  setPosition: vi.fn().mockResolvedValue(undefined),
  onResized: vi.fn().mockResolvedValue(vi.fn()),
  onMoved: vi.fn().mockResolvedValue(vi.fn())
}

const mockMonitors = [
  { position: { x: 0, y: 0 }, size: { width: 3840, height: 2160 }, scaleFactor: 2 }
]

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => mockWindow),
  availableMonitors: vi.fn(() => Promise.resolve(mockMonitors))
}))

vi.mock('@tauri-apps/api/dpi', () => ({
  LogicalSize: vi.fn((w, h) => ({ width: w, height: h })),
  LogicalPosition: vi.fn((x, y) => ({ x, y }))
}))

const mockStore = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  save: vi.fn().mockResolvedValue(undefined)
}

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(() => Promise.resolve(mockStore))
}))

describe('useWindowState', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Reset defaults after clearAllMocks
    mockWindow.innerSize.mockResolvedValue({ width: 1600, height: 1200 })
    mockWindow.outerPosition.mockResolvedValue({ x: 200, y: 200 })
    mockWindow.scaleFactor.mockResolvedValue(2)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should restore window state from preferences', async () => {
    const { usePreferencesStore } = await import('@/stores/usePreferencesStore.js')
    const prefsStore = usePreferencesStore()
    prefsStore.windowState = { width: 1024, height: 700, x: 50, y: 75 }

    const { useWindowState } = await import('./useWindowState.js')
    const { restoreState } = useWindowState()
    await restoreState()

    expect(mockWindow.setSize).toHaveBeenCalledWith({ width: 1024, height: 700 })
    expect(mockWindow.setPosition).toHaveBeenCalledWith({ x: 50, y: 75 })
  })

  it('should not restore position if saved position is off-screen', async () => {
    const { availableMonitors } = await import('@tauri-apps/api/window')
    availableMonitors.mockResolvedValue([
      { position: { x: 0, y: 0 }, size: { width: 3840, height: 2160 }, scaleFactor: 2 }
    ])

    const { usePreferencesStore } = await import('@/stores/usePreferencesStore.js')
    const prefsStore = usePreferencesStore()
    prefsStore.windowState = { width: 800, height: 600, x: 5000, y: 5000 }

    const { useWindowState } = await import('./useWindowState.js')
    const { restoreState } = useWindowState()
    await restoreState()

    expect(mockWindow.setSize).toHaveBeenCalledWith({ width: 800, height: 600 })
    expect(mockWindow.setPosition).not.toHaveBeenCalled()
  })

  it('should not restore if no saved state', async () => {
    const { useWindowState } = await import('./useWindowState.js')
    const { restoreState } = useWindowState()
    await restoreState()

    expect(mockWindow.setSize).not.toHaveBeenCalled()
    expect(mockWindow.setPosition).not.toHaveBeenCalled()
  })

  it('should register resize and move listeners', async () => {
    const { useWindowState } = await import('./useWindowState.js')
    const { listenToChanges } = useWindowState()
    await listenToChanges()

    expect(mockWindow.onResized).toHaveBeenCalled()
    expect(mockWindow.onMoved).toHaveBeenCalled()
  })

  it('should save logical coordinates on resize', async () => {
    let resizeCallback
    mockWindow.onResized.mockImplementation(async (cb) => {
      resizeCallback = cb
      return vi.fn()
    })

    const { usePreferencesStore } = await import('@/stores/usePreferencesStore.js')
    const prefsStore = usePreferencesStore()
    const saveSpy = vi.spyOn(prefsStore, 'saveWindowState')

    const { useWindowState } = await import('./useWindowState.js')
    const { listenToChanges } = useWindowState()
    await listenToChanges()

    await resizeCallback()

    // Physical 1600x1200 @ scale 2 = logical 800x600
    expect(saveSpy).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      x: 100,
      y: 100
    })
  })

  it('should cleanup listeners on destroy', async () => {
    const unlistenResize = vi.fn()
    const unlistenMove = vi.fn()
    mockWindow.onResized.mockResolvedValue(unlistenResize)
    mockWindow.onMoved.mockResolvedValue(unlistenMove)

    const { useWindowState } = await import('./useWindowState.js')
    const { listenToChanges, destroy } = useWindowState()
    await listenToChanges()

    destroy()

    expect(unlistenResize).toHaveBeenCalled()
    expect(unlistenMove).toHaveBeenCalled()
  })
})
