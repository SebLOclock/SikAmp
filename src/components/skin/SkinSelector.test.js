import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock Tauri core
vi.mock('@tauri-apps/api/core', () => {
  const mockInvoke = vi.fn().mockResolvedValue([])
  return {
    invoke: mockInvoke,
    convertFileSrc: vi.fn((path) => `asset://${path}`),
    __mockInvoke: mockInvoke
  }
})

// Mock Tauri Store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock useFocusTrap composable
vi.mock('@/composables/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn()
  })
}))

import SkinSelector from './SkinSelector.vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { __mockInvoke as mockInvoke } from '@tauri-apps/api/core'

describe('SkinSelector (Story 4.2)', () => {
  let skinStore
  let preferencesStore

  function mountSelector(props = {}) {
    return mount(SkinSelector, {
      props: { visible: true, ...props },
      global: {
        plugins: [],
        stubs: {
          Transition: false
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    skinStore = useSkinStore()
    preferencesStore = usePreferencesStore()
    mockInvoke.mockResolvedValue([
      { name: 'Garfield', path: '/skins/Garfield.wsz' },
      { name: 'Netscape', path: '/skins/Netscape.wsz' }
    ])
  })

  describe('Rendu de base (AC #1)', () => {
    it('ne rend rien quand visible est false', () => {
      const wrapper = mountSelector({ visible: false })
      expect(wrapper.find('.skin-overlay').exists()).toBe(false)
    })

    it('affiche le panneau quand visible est true', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-overlay').exists()).toBe(true)
      })
    })

    it('affiche le titre "SKINS"', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-title').text()).toBe('SKINS')
      })
    })

    it('affiche le bouton fermer', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-close').exists()).toBe(true)
        expect(wrapper.find('.skin-close').text()).toBe('×')
      })
    })
  })

  describe('Liste des skins (AC #1, #5)', () => {
    it('affiche "Classic Faithful" en tête de liste', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const items = wrapper.findAll('.skin-item')
        expect(items.length).toBeGreaterThanOrEqual(1)
        expect(items[0].text()).toBe('Classic Faithful')
      })
    })

    it("appelle list_skins via IPC Tauri à l'ouverture", async () => {
      mountSelector()
      await vi.waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('list_skins')
      })
    })

    it('affiche les skins retournés par list_skins après "Classic Faithful"', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const items = wrapper.findAll('.skin-item')
        expect(items.length).toBe(3) // Classic Faithful + 2 skins
        expect(items[0].text()).toBe('Classic Faithful')
        expect(items[1].text()).toBe('Garfield')
        expect(items[2].text()).toBe('Netscape')
      })
    })

    it('gère une liste vide sans erreur', async () => {
      mockInvoke.mockResolvedValue([])
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const items = wrapper.findAll('.skin-item')
        expect(items.length).toBe(1) // Only Classic Faithful
        expect(items[0].text()).toBe('Classic Faithful')
      })
    })
  })

  describe('Surbrillance du skin actif (AC #1)', () => {
    it('marque "Classic Faithful" comme actif quand aucun skin custom n\'est chargé', async () => {
      skinStore.isCustomSkin = false
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const items = wrapper.findAll('.skin-item')
        expect(items[0].classes()).toContain('active')
      })
    })

    it('marque le skin custom actif en surbrillance', async () => {
      skinStore.isCustomSkin = true
      skinStore.currentSkinPath = '/skins/Garfield.wsz'
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const items = wrapper.findAll('.skin-item')
        expect(items[0].classes()).not.toContain('active')
        expect(items[1].classes()).toContain('active')
      })
    })
  })

  describe('Sélection de skin (AC #2, #3)', () => {
    it('appelle loadSkinFromWsz et setSkinPath au clic sur un skin custom', async () => {
      const loadSpy = vi.spyOn(skinStore, 'loadSkinFromWsz').mockResolvedValue()
      const setSkinSpy = vi.spyOn(preferencesStore, 'setSkinPath')
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.findAll('.skin-item').length).toBe(3)
      })
      await wrapper.findAll('.skin-item')[1].trigger('click')
      expect(loadSpy).toHaveBeenCalledWith('/skins/Garfield.wsz')
      await vi.waitFor(() => {
        expect(setSkinSpy).toHaveBeenCalledWith('/skins/Garfield.wsz')
      })
    })

    it('appelle resetToDefaultSkin et setSkinPath(null) au clic sur "Classic Faithful"', async () => {
      const resetSpy = vi.spyOn(skinStore, 'resetToDefaultSkin')
      const setSkinSpy = vi.spyOn(preferencesStore, 'setSkinPath')
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.findAll('.skin-item').length).toBe(3)
      })
      await wrapper.findAll('.skin-item')[0].trigger('click')
      expect(resetSpy).toHaveBeenCalled()
      expect(setSkinSpy).toHaveBeenCalledWith(null)
    })
  })

  describe('Fermeture du panneau (AC #4)', () => {
    it('émet "close" au clic sur le bouton fermer', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-close').exists()).toBe(true)
      })
      await wrapper.find('.skin-close').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('émet "close" au clic sur l\'overlay', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-overlay').exists()).toBe(true)
      })
      await wrapper.find('.skin-overlay').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('émet "close" sur Escape', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-overlay').exists()).toBe(true)
      })
      await wrapper.find('.skin-overlay').trigger('keydown.escape')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('Accessibilité (AC #6)', () => {
    it('le panneau a un aria-label "Sélecteur de skins"', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('.skin-overlay').attributes('aria-label')).toBe('Sélecteur de skins')
      })
    })

    it('la liste a le rôle "listbox"', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
      })
    })

    it('chaque skin a le rôle "option"', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const options = wrapper.findAll('[role="option"]')
        expect(options.length).toBe(3)
      })
    })

    it('le skin actif a aria-selected="true"', async () => {
      skinStore.isCustomSkin = false
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const options = wrapper.findAll('[role="option"]')
        expect(options[0].attributes('aria-selected')).toBe('true')
        expect(options[1].attributes('aria-selected')).toBe('false')
      })
    })

    it('navigation au clavier : ArrowDown déplace le focus', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.findAll('.skin-item').length).toBe(3)
      })
      const list = wrapper.find('[role="listbox"]')
      await list.trigger('keydown', { key: 'ArrowDown' })
      await wrapper.vm.$nextTick()
      const items = wrapper.findAll('.skin-item')
      // Focus should move to the next item
      expect(items.some((item) => item.classes().includes('focused'))).toBe(true)
    })

    it('navigation au clavier : Enter applique le skin sélectionné', async () => {
      const loadSpy = vi.spyOn(skinStore, 'loadSkinFromWsz').mockResolvedValue()
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        expect(wrapper.findAll('.skin-item').length).toBe(3)
      })
      const list = wrapper.find('[role="listbox"]')
      // Navigate to Garfield (index 1)
      await list.trigger('keydown', { key: 'ArrowDown' })
      await wrapper.vm.$nextTick()
      await list.trigger('keydown', { key: 'Enter' })
      await vi.waitFor(() => {
        expect(loadSpy).toHaveBeenCalledWith('/skins/Garfield.wsz')
      })
    })
  })

  describe('Theming dynamique (AC #2)', () => {
    it('le panneau utilise les couleurs du skinStore', async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const panel = wrapper.find('.skin-panel')
        expect(panel.attributes('style')).toContain(skinStore.colors.background)
      })
    })

    it("l'overlay utilise displayBg + transparence", async () => {
      const wrapper = mountSelector()
      await vi.waitFor(() => {
        const overlay = wrapper.find('.skin-overlay')
        expect(overlay.attributes('style')).toContain(skinStore.colors.displayBg + 'EE')
      })
    })
  })
})
