<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps({
  visible: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'close'])
const skinStore = useSkinStore()
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap()

const menuRef = ref(null)
const focusedItemIndex = ref(0)

// Get non-separator items for keyboard navigation
function getActionableItems() {
  return props.items
    .map((item, i) => ({ item, index: i }))
    .filter(({ item }) => item.label !== 'separator' && !item.disabled)
}

function getMenuStyle() {
  if (!props.visible) return { display: 'none' }

  return {
    position: 'fixed',
    left: `${props.x}px`,
    top: `${props.y}px`,
    zIndex: 1000
  }
}

function clampToViewport() {
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  let left = props.x
  let top = props.y
  if (left + rect.width > window.innerWidth) {
    left = window.innerWidth - rect.width
  }
  if (top + rect.height > window.innerHeight) {
    top = Math.max(0, top - rect.height)
  }
  menuRef.value.style.left = `${left}px`
  menuRef.value.style.top = `${top}px`
}

function handleItemClick(item) {
  if (item.disabled || item.label === 'separator') return
  emit('select', item.action)
  emit('close')
}

function handleKeyDown(event) {
  const actionable = getActionableItems()
  if (actionable.length === 0) return

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault()
      event.stopPropagation()
      const currentActionableIdx = actionable.findIndex((a) => a.index === focusedItemIndex.value)
      const nextIdx = currentActionableIdx < actionable.length - 1 ? currentActionableIdx + 1 : 0
      focusedItemIndex.value = actionable[nextIdx].index
      focusItem(focusedItemIndex.value)
      break
    }
    case 'ArrowUp': {
      event.preventDefault()
      event.stopPropagation()
      const currentActionableIdx = actionable.findIndex((a) => a.index === focusedItemIndex.value)
      const prevIdx = currentActionableIdx > 0 ? currentActionableIdx - 1 : actionable.length - 1
      focusedItemIndex.value = actionable[prevIdx].index
      focusItem(focusedItemIndex.value)
      break
    }
    case 'Enter': {
      event.preventDefault()
      event.stopPropagation()
      const item = props.items[focusedItemIndex.value]
      if (item && !item.disabled && item.label !== 'separator') {
        handleItemClick(item)
      }
      break
    }
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      emit('close')
      break
  }
}

function focusItem(index) {
  if (!menuRef.value) return
  const el = menuRef.value.querySelector(`[data-index="${index}"]`)
  if (el) el.focus()
}

function handleClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    emit('close')
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      console.log(`[ContextMenu] Menu opened at (${props.x}, ${props.y})`)
      // Focus first actionable item
      const actionable = getActionableItems()
      focusedItemIndex.value = actionable.length > 0 ? actionable[0].index : 0

      await nextTick()
      if (menuRef.value) {
        clampToViewport()
        activateTrap(menuRef.value)
        focusItem(focusedItemIndex.value)
      }
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
      deactivateTrap()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  deactivateTrap()
})
</script>

<template>
  <div
    v-if="visible"
    ref="menuRef"
    role="menu"
    class="context-menu"
    :style="getMenuStyle()"
    @keydown="handleKeyDown"
  >
    <template v-for="(item, index) in items" :key="index">
      <hr
        v-if="item.label === 'separator'"
        class="context-menu-separator"
        :style="{ borderColor: skinStore.colors.lightEdge }"
      />
      <div
        v-else
        :data-index="index"
        role="menuitem"
        :tabindex="index === focusedItemIndex ? 0 : -1"
        :aria-disabled="item.disabled || undefined"
        :aria-label="item.label"
        class="context-menu-item"
        :class="{
          'context-menu-item--disabled': item.disabled,
          'context-menu-item--focused': index === focusedItemIndex
        }"
        :style="{
          color: item.disabled ? skinStore.colors.disabledControls : skinStore.colors.playlistText,
          backgroundColor:
            index === focusedItemIndex && !item.disabled
              ? skinStore.colors.accentMetallic
              : 'transparent'
        }"
        @click="handleItemClick(item)"
        @mouseenter="!item.disabled && (focusedItemIndex = index)"
      >
        {{ item.label }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.context-menu {
  min-width: 200px;
  padding: 4px 0;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  border: 1px solid v-bind('skinStore.colors.lightEdge');
  background-color: v-bind('skinStore.colors.playlistBg');
}

.context-menu-item {
  padding: 4px 16px;
  cursor: pointer;
  white-space: nowrap;
  outline: none;
}

.context-menu-item:hover:not(.context-menu-item--disabled) {
  color: v-bind('skinStore.colors.activeTrack') !important;
}

.context-menu-item--disabled {
  cursor: default;
}

.context-menu-item--focused:not(.context-menu-item--disabled) {
  color: v-bind('skinStore.colors.activeTrack') !important;
}

.context-menu-separator {
  border: none;
  border-top: 1px solid;
  margin: 4px 8px;
}
</style>
