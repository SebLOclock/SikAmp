import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

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

import PreferencesPanel from './PreferencesPanel.vue'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useSkinStore } from '@/stores/useSkinStore'

describe('PreferencesPanel (Story 2.2)', () => {
  let preferencesStore
  let skinStore

  function mountPanel(props = {}) {
    return mount(PreferencesPanel, {
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
    setActivePinia(createPinia())
    preferencesStore = usePreferencesStore()
    skinStore = useSkinStore()
  })

  describe('Toggle crossfade', () => {
    it('affiche le toggle crossfade avec le label "Fondu enchaîné"', () => {
      const wrapper = mountPanel()
      const rows = wrapper.findAll('.pref-row')
      expect(rows[0].text()).toContain('Fondu enchaîné')
    })

    it("le toggle reflète l'état crossfadeEnabled du store", () => {
      preferencesStore.crossfadeEnabled = true
      const wrapper = mountPanel()
      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      expect(toggle.attributes('aria-checked')).toBe('true')
    })

    it('le toggle met à jour le store au clic', async () => {
      preferencesStore.crossfadeEnabled = true
      const wrapper = mountPanel()
      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      await toggle.trigger('click')
      expect(preferencesStore.crossfadeEnabled).toBe(false)
    })

    it('le toggle a le rôle ARIA "switch" avec aria-checked dynamique', () => {
      preferencesStore.crossfadeEnabled = false
      const wrapper = mountPanel()
      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      expect(toggle.attributes('role')).toBe('switch')
      expect(toggle.attributes('aria-checked')).toBe('false')
    })

    it("l'aria-label du toggle reflète l'état activé/désactivé", () => {
      preferencesStore.crossfadeEnabled = true
      const wrapper = mountPanel()
      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      expect(toggle.attributes('aria-label')).toBe('Fondu enchaîné : activé')
    })

    it("le toggle est synchronisé avec la même source que l'ActionBar (preferencesStore.crossfadeEnabled)", async () => {
      preferencesStore.crossfadeEnabled = true
      const wrapper = mountPanel()

      // Simulate ActionBar toggling off
      preferencesStore.setCrossfadeEnabled(false)
      await wrapper.vm.$nextTick()

      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      expect(toggle.attributes('aria-checked')).toBe('false')
    })
  })

  describe('Slider de durée', () => {
    it('affiche le slider avec les bonnes valeurs min/max', () => {
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.exists()).toBe(true)
      expect(slider.attributes('min')).toBe('1')
      expect(slider.attributes('max')).toBe('12')
      expect(slider.attributes('step')).toBe('1')
    })

    it('affiche la valeur courante du store', () => {
      preferencesStore.crossfadeDuration = 7
      const wrapper = mountPanel()
      const value = wrapper.find('.slider-value')
      expect(value.text()).toBe('7s')
    })

    it('met à jour preferencesStore.crossfadeDuration au changement', async () => {
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      await slider.setValue('9')
      expect(preferencesStore.crossfadeDuration).toBe(9)
    })

    it('le slider est désactivé visuellement quand crossfade est OFF', () => {
      preferencesStore.crossfadeEnabled = false
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.attributes('disabled')).toBeDefined()
      const sliderRow = wrapper.find('.pref-slider-row')
      expect(sliderRow.attributes('style')).toContain('opacity: 0.4')
    })

    it('le slider est activé quand crossfade est ON', () => {
      preferencesStore.crossfadeEnabled = true
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.attributes('disabled')).toBeUndefined()
      const sliderRow = wrapper.find('.pref-slider-row')
      expect(sliderRow.attributes('style')).toContain('opacity: 1')
    })
  })

  describe('Attributs ARIA du slider', () => {
    it('a les attributs aria-valuemin, aria-valuemax, aria-valuenow', () => {
      preferencesStore.crossfadeDuration = 5
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      // role="slider" is implicit on <input type="range"> — no explicit role needed
      expect(slider.attributes('aria-valuemin')).toBe('1')
      expect(slider.attributes('aria-valuemax')).toBe('12')
      expect(slider.attributes('aria-valuenow')).toBe('5')
    })

    it('aria-label annonce la durée en secondes', () => {
      preferencesStore.crossfadeDuration = 8
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.attributes('aria-label')).toBe('Durée du fondu enchaîné : 8 secondes')
    })
  })

  describe('Ordre des préférences', () => {
    it('le crossfade est affiché avant le jingle et le mode de rendu', () => {
      const wrapper = mountPanel()
      const rows = wrapper.findAll('.pref-row')
      // Row 0: Fondu enchaîné toggle
      // Row 1: Slider row (pref-slider-row)
      // Row 2: Jingle au lancement
      // Row 3: Mode de rendu
      expect(rows[0].text()).toContain('Fondu enchaîné')
      expect(rows[1].text()).toContain('Durée du fondu')
      expect(rows[2].text()).toContain('Jingle au lancement')
      expect(rows[3].text()).toContain('Mode de rendu')
    })
  })

  describe('Navigation clavier (AC 5)', () => {
    it('le slider est focusable et a step=1 pour navigation flèches', () => {
      preferencesStore.crossfadeEnabled = true
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.attributes('step')).toBe('1')
      expect(slider.attributes('disabled')).toBeUndefined()
    })

    it('le slider a un aria-label descriptif avec la durée en secondes', () => {
      preferencesStore.crossfadeDuration = 3
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.attributes('aria-label')).toBe('Durée du fondu enchaîné : 3 secondes')
    })
  })

  describe('Persistance (AC 3)', () => {
    it('le slider lit crossfadeDuration depuis le store (source de persistance)', () => {
      preferencesStore.crossfadeDuration = 10
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      expect(slider.element.value).toBe('10')
      const value = wrapper.find('.slider-value')
      expect(value.text()).toBe('10s')
    })

    it('setCrossfadeDuration est appelé au changement du slider (déclenche la persistance)', async () => {
      const spy = vi.spyOn(preferencesStore, 'setCrossfadeDuration')
      const wrapper = mountPanel()
      const slider = wrapper.find('input[type="range"]')
      await slider.setValue('4')
      expect(spy).toHaveBeenCalledWith(4)
    })
  })

  describe('Synchronisation ActionBar bidirectionnelle (AC 4)', () => {
    it('le toggle lit directement preferencesStore.crossfadeEnabled (même source que ActionBar)', () => {
      preferencesStore.crossfadeEnabled = false
      const wrapper = mountPanel()
      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      expect(toggle.attributes('aria-checked')).toBe('false')
    })

    it('le clic sur le toggle appelle setCrossfadeEnabled (même action que ActionBar)', async () => {
      preferencesStore.crossfadeEnabled = false
      const spy = vi.spyOn(preferencesStore, 'setCrossfadeEnabled')
      const wrapper = mountPanel()
      const toggle = wrapper.find('[aria-label*="Fondu enchaîné"]')
      await toggle.trigger('click')
      expect(spy).toHaveBeenCalledWith(true)
    })
  })

  describe('Panel non visible', () => {
    it('ne rend rien quand visible est false', () => {
      const wrapper = mountPanel({ visible: false })
      expect(wrapper.find('.prefs-overlay').exists()).toBe(false)
    })
  })
})
