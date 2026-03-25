<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useFocusTrap } from '@/composables/useFocusTrap'

const skinStore = useSkinStore()
const preferencesStore = usePreferencesStore()
const playerStore = usePlayerStore()
const overlayRef = ref(null)
const listRef = ref(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const skins = ref([])
const focusedIndex = ref(-1)

const isModernMode = computed(() => skinStore.renderMode === 'modern')
const activeSkinId = computed(() => focusedIndex.value >= 0 ? `skin-option-${focusedIndex.value}` : undefined)

const DEFAULT_SKIN_ENTRY = { name: 'Classic Faithful', path: null }

const allSkins = computed(() => [DEFAULT_SKIN_ENTRY, ...skins.value])

function isActiveSkin(skin) {
  if (skin.path === null) {
    return !skinStore.isCustomSkin
  }
  return skinStore.currentSkinPath === skin.path
}

async function loadSkinList() {
  try {
    const result = await invoke('list_skins')
    skins.value = result
  } catch (err) {
    console.warn('[SkinSelector] Failed to list skins:', err)
    skins.value = []
  }
}

async function selectSkin(skin) {
  if (skin.path === null) {
    skinStore.resetToDefaultSkin()
    preferencesStore.setSkinPath(null)
  } else {
    try {
      await skinStore.loadSkinFromWsz(skin.path)
      preferencesStore.setSkinPath(skin.path)
    } catch (err) {
      console.warn('[SkinSelector] Failed to load skin:', err)
      playerStore.showFeedback(`Skin invalide : ${skin.name}`, 'error')
    }
  }
}

function handleKeydown(event) {
  const list = allSkins.value
  if (!list.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, list.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (focusedIndex.value >= 0 && focusedIndex.value < list.length) {
      selectSkin(list[focusedIndex.value])
    }
  }
}

watch(() => props.visible, async (v) => {
  if (v) {
    await loadSkinList()
    // Set focused index to the active skin
    const activeIdx = allSkins.value.findIndex(s => isActiveSkin(s))
    focusedIndex.value = activeIdx >= 0 ? activeIdx : 0
    await nextTick()
    if (overlayRef.value) activateTrap(overlayRef.value)
  } else {
    deactivateTrap()
  }
}, { immediate: true })

onUnmounted(() => deactivateTrap())

// Scroll focused item into view
watch(focusedIndex, async () => {
  await nextTick()
  const el = listRef.value?.querySelector('[data-focused="true"]')
  if (el) el.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <Transition :name="isModernMode ? 'overlay-fade' : ''">
  <div
    v-if="visible"
    ref="overlayRef"
    class="skin-overlay overlay-panel"
    tabindex="-1"
    aria-label="Sélecteur de skins"
    :style="{ backgroundColor: skinStore.colors.displayBg + 'EE' }"
    @click.self="emit('close')"
    @keydown.escape="emit('close')"
  >
    <div class="skin-panel" :style="{ backgroundColor: skinStore.colors.background, borderColor: skinStore.colors.accentMetallic }">
      <div class="skin-header" :style="{ borderBottomColor: skinStore.colors.accentMetallic }">
        <span class="skin-title" :style="{ color: skinStore.colors.textPrimary }">SKINS</span>
        <button
          class="skin-close"
          :style="{ color: skinStore.colors.textPrimary }"
          aria-label="Fermer le sélecteur de skins"
          @click="emit('close')"
        >×</button>
      </div>
      <div class="skin-body">
        <ul
          ref="listRef"
          role="listbox"
          aria-label="Sélecteur de skins"
          :aria-activedescendant="activeSkinId"
          class="skin-list"
          @keydown="handleKeydown"
        >
          <li
            v-for="(skin, index) in allSkins"
            :id="'skin-option-' + index"
            :key="skin.path ?? 'default'"
            role="option"
            :aria-selected="isActiveSkin(skin)"
            :data-focused="focusedIndex === index"
            :tabindex="focusedIndex === index ? 0 : -1"
            class="skin-item"
            :class="{ active: isActiveSkin(skin), focused: focusedIndex === index }"
            :style="{
              color: skinStore.colors.textSecondary,
              backgroundColor: isActiveSkin(skin) ? skinStore.colors.accentMetallic + '44' : 'transparent',
              outlineColor: focusedIndex === index ? skinStore.colors.textPrimary : 'transparent'
            }"
            @click="selectSkin(skin)"
          >
            {{ skin.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
  </Transition>
</template>

<style scoped>
.skin-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.skin-panel {
  border: 1px solid;
  padding: 0;
  min-width: 280px;
  max-width: 400px;
  font-family: 'Courier New', monospace;
}

.skin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid;
}

.skin-title {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
}

.skin-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.skin-body {
  padding: 0;
}

.skin-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 240px;
  overflow-y: auto;
}

.skin-item {
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  outline: 1px solid transparent;
  outline-offset: -1px;
  transition: background-color 0.1s;
}

.skin-item:hover {
  filter: brightness(1.2);
}

.skin-item.focused {
  outline-style: solid;
}

/* Modern mode fade transition (150ms) */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 150ms ease-out;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
