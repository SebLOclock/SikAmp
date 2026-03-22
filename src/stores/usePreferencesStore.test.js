import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn()
}

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(() => Promise.resolve(mockStore))
}))

describe('usePreferencesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.get.mockResolvedValue(null)
  })

  it('should have jingleEnabled default to true', async () => {
    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()
    expect(store.jingleEnabled).toBe(true)
  })

  it('should toggle jingleEnabled on/off', async () => {
    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()

    expect(store.jingleEnabled).toBe(true)
    store.toggleJingle()
    expect(store.jingleEnabled).toBe(false)
    store.toggleJingle()
    expect(store.jingleEnabled).toBe(true)
  })

  it('should load jingleEnabled from Tauri store', async () => {
    mockStore.get.mockImplementation((key) => {
      if (key === 'jingleEnabled') return Promise.resolve(false)
      return Promise.resolve(null)
    })

    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()
    await store.loadPreferences()

    expect(store.jingleEnabled).toBe(false)
  })

  it('should persist jingleEnabled when toggled', async () => {
    vi.useFakeTimers()
    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()

    store.toggleJingle()

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(600)

    expect(mockStore.set).toHaveBeenCalledWith('jingleEnabled', false)
    expect(mockStore.save).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('should keep jingleEnabled true when not saved in store', async () => {
    mockStore.get.mockResolvedValue(null)

    const { usePreferencesStore } = await import('./usePreferencesStore.js')
    const store = usePreferencesStore()
    await store.loadPreferences()

    expect(store.jingleEnabled).toBe(true)
  })
})
