import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockEventCallback = null
const mockUnlisten = vi.fn()

// Mock Tauri webview API
vi.mock('@tauri-apps/api/webview', () => ({
  getCurrentWebview: () => ({
    onDragDropEvent: vi.fn(async (callback) => {
      mockEventCallback = callback
      return mockUnlisten
    })
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

describe('useFileDrop', () => {
  let useFileDrop
  let onFilesDropped

  beforeEach(async () => {
    vi.resetModules()
    mockEventCallback = null
    mockUnlisten.mockClear()
    onFilesDropped = vi.fn()

    const mod = await import('./useFileDrop.js')
    useFileDrop = mod.useFileDrop
  })

  it('returns isDragging ref initially false', async () => {
    const { isDragging } = useFileDrop(onFilesDropped)
    // Wait for onMounted async
    await vi.waitFor(() => expect(mockEventCallback).not.toBeNull())
    expect(isDragging.value).toBe(false)
  })

  it('sets isDragging to true on drag-over event', async () => {
    const { isDragging } = useFileDrop(onFilesDropped)
    await vi.waitFor(() => expect(mockEventCallback).not.toBeNull())

    mockEventCallback({ payload: { type: 'over' } })
    expect(isDragging.value).toBe(true)
  })

  it('sets isDragging to false on drag-leave event', async () => {
    const { isDragging } = useFileDrop(onFilesDropped)
    await vi.waitFor(() => expect(mockEventCallback).not.toBeNull())

    mockEventCallback({ payload: { type: 'over' } })
    expect(isDragging.value).toBe(true)

    mockEventCallback({ payload: { type: 'leave' } })
    expect(isDragging.value).toBe(false)
  })

  it('calls onFilesDropped with paths on drop event', async () => {
    const { isDragging } = useFileDrop(onFilesDropped)
    await vi.waitFor(() => expect(mockEventCallback).not.toBeNull())

    const paths = ['/music/song1.mp3', '/music/song2.flac']
    mockEventCallback({ payload: { type: 'drop', paths } })

    expect(isDragging.value).toBe(false)
    expect(onFilesDropped).toHaveBeenCalledWith(paths)
  })

  it('does not call onFilesDropped when paths are empty', async () => {
    useFileDrop(onFilesDropped)
    await vi.waitFor(() => expect(mockEventCallback).not.toBeNull())

    mockEventCallback({ payload: { type: 'drop', paths: [] } })
    expect(onFilesDropped).not.toHaveBeenCalled()
  })

  it('does not call onFilesDropped when paths are null', async () => {
    useFileDrop(onFilesDropped)
    await vi.waitFor(() => expect(mockEventCallback).not.toBeNull())

    mockEventCallback({ payload: { type: 'drop', paths: null } })
    expect(onFilesDropped).not.toHaveBeenCalled()
  })
})
