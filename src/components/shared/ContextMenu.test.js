import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock useFocusTrap composable
vi.mock('@/composables/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn()
  })
}))

import ContextMenu from './ContextMenu.vue'

const defaultItems = [
  { label: 'Ouvrir fichier', action: 'open-file' },
  { label: 'Ouvrir dossier', action: 'open-folder' },
  { label: 'separator' },
  { label: 'Nouvelle playlist', action: 'new-playlist' },
  { label: 'Retirer le morceau', action: 'remove-track', disabled: true },
  { label: 'Retirer tout', action: 'remove-all' }
]

describe('ContextMenu (Story 3.3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountMenu(props = {}) {
    return mount(ContextMenu, {
      props: {
        visible: true,
        x: 100,
        y: 200,
        items: defaultItems,
        ...props
      },
      attachTo: document.body
    })
  }

  describe('Rendering', () => {
    it('renders nothing when not visible', () => {
      const wrapper = mountMenu({ visible: false })
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })

    it('renders menu when visible', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    })

    it('renders all non-separator items as menuitems', () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      expect(items).toHaveLength(5) // 6 items minus 1 separator
    })

    it('renders separators as hr elements', () => {
      const wrapper = mountMenu()
      const separators = wrapper.findAll('hr')
      expect(separators).toHaveLength(1)
    })

    it('displays item labels', () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      expect(items[0].text()).toBe('Ouvrir fichier')
      expect(items[1].text()).toBe('Ouvrir dossier')
    })

    it('marks disabled items with aria-disabled', () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      const disabledItem = items.find(i => i.text() === 'Retirer le morceau')
      expect(disabledItem.attributes('aria-disabled')).toBe('true')
    })

    it('has aria-label on each menuitem', () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      items.forEach(item => {
        expect(item.attributes('aria-label')).toBeTruthy()
      })
    })
  })

  describe('Positioning', () => {
    it('positions menu at given x,y coordinates', () => {
      const wrapper = mountMenu({ x: 150, y: 250 })
      const menu = wrapper.find('[role="menu"]')
      expect(menu.attributes('style')).toContain('left: 150px')
      expect(menu.attributes('style')).toContain('top: 250px')
    })
  })

  describe('Item selection', () => {
    it('emits select and close when item is clicked', async () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      await items[0].trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0]).toEqual(['open-file'])
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('does not emit select when disabled item is clicked', async () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      const disabledItem = items.find(i => i.text() === 'Retirer le morceau')
      await disabledItem.trigger('click')
      expect(wrapper.emitted('select')).toBeFalsy()
    })
  })

  describe('Keyboard navigation', () => {
    it('navigates down with ArrowDown', async () => {
      const wrapper = mountMenu()
      const menu = wrapper.find('[role="menu"]')
      await menu.trigger('keydown', { key: 'ArrowDown' })
      // Should move focus to second actionable item
      const items = wrapper.findAll('[role="menuitem"]')
      // Check that focusedItemIndex changed (item index 1 = "Ouvrir dossier")
      expect(items[1].classes()).toContain('context-menu-item--focused')
    })

    it('navigates up with ArrowUp', async () => {
      const wrapper = mountMenu()
      const menu = wrapper.find('[role="menu"]')
      // Move down first, then up
      await menu.trigger('keydown', { key: 'ArrowDown' })
      await menu.trigger('keydown', { key: 'ArrowUp' })
      const items = wrapper.findAll('[role="menuitem"]')
      expect(items[0].classes()).toContain('context-menu-item--focused')
    })

    it('wraps around when navigating past last item', async () => {
      const wrapper = mountMenu()
      const menu = wrapper.find('[role="menu"]')
      // Navigate down past all actionable items (5 actionable: indices 0,1,3,5 → skip disabled index 4)
      // Actionable: open-file(0), open-folder(1), new-playlist(3), remove-all(5) = 4 items
      for (let i = 0; i < 4; i++) {
        await menu.trigger('keydown', { key: 'ArrowDown' })
      }
      // Should wrap to first
      const items = wrapper.findAll('[role="menuitem"]')
      expect(items[0].classes()).toContain('context-menu-item--focused')
    })

    it('selects item with Enter', async () => {
      const wrapper = mountMenu()
      const menu = wrapper.find('[role="menu"]')
      await menu.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0]).toEqual(['open-file'])
    })

    it('closes on Escape', async () => {
      const wrapper = mountMenu()
      const menu = wrapper.find('[role="menu"]')
      await menu.trigger('keydown', { key: 'Escape' })
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('skips disabled items during navigation', async () => {
      const wrapper = mountMenu()
      const menu = wrapper.find('[role="menu"]')
      // Navigate: start at 0 (open-file), down to 1 (open-folder), down to 3 (new-playlist), down to 5 (remove-all) — skips disabled 4
      await menu.trigger('keydown', { key: 'ArrowDown' }) // → open-folder (index 1)
      await menu.trigger('keydown', { key: 'ArrowDown' }) // → new-playlist (index 3)
      await menu.trigger('keydown', { key: 'ArrowDown' }) // → remove-all (index 5)

      // Now Enter should select remove-all
      await menu.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('select')[0]).toEqual(['remove-all'])
    })
  })

  describe('Click outside', () => {
    it('emits close when clicking outside the menu', async () => {
      // Mount with visible=false first, then set to true to trigger watcher
      const wrapper = mountMenu({ visible: false })
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()
      // Simulate mousedown outside
      const mouseEvent = new MouseEvent('mousedown', { bubbles: true })
      document.body.dispatchEvent(mouseEvent)
      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })
  })

  describe('ARIA roles', () => {
    it('has role="menu" on container', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    })

    it('has role="menuitem" on each option', () => {
      const wrapper = mountMenu()
      const items = wrapper.findAll('[role="menuitem"]')
      expect(items.length).toBeGreaterThan(0)
    })

    it('separators do not have menuitem role', () => {
      const wrapper = mountMenu()
      const hrs = wrapper.findAll('hr')
      hrs.forEach(hr => {
        expect(hr.attributes('role')).toBeUndefined()
      })
    })
  })

  afterEach(() => {
    // Clean up any remaining event listeners
    document.body.innerHTML = ''
  })
})
