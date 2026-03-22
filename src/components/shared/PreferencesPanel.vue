<script setup>
import { ref, watch, nextTick } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'

const skinStore = useSkinStore()
const preferencesStore = usePreferencesStore()
const overlayRef = ref(null)

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

watch(() => props.visible, async (v) => {
  if (v) {
    await nextTick()
    overlayRef.value?.focus()
  }
})

function handleToggleJingle() {
  preferencesStore.toggleJingle()
}
</script>

<template>
  <div
    v-if="visible"
    ref="overlayRef"
    class="prefs-overlay"
    tabindex="-1"
    :style="{ backgroundColor: skinStore.colors.displayBg + 'EE' }"
    @click.self="emit('close')"
    @keydown.escape="emit('close')"
  >
    <div class="prefs-panel" :style="{ backgroundColor: skinStore.colors.background, borderColor: skinStore.colors.accentMetallic }">
      <div class="prefs-header" :style="{ borderBottomColor: skinStore.colors.accentMetallic }">
        <span class="prefs-title" :style="{ color: skinStore.colors.textPrimary }">PREFERENCES</span>
        <button
          class="prefs-close"
          :style="{ color: skinStore.colors.textPrimary }"
          aria-label="Fermer les préférences"
          @click="emit('close')"
        >×</button>
      </div>
      <div class="prefs-body">
        <label class="pref-row" :style="{ color: skinStore.colors.textSecondary }">
          <span>Jingle au lancement</span>
          <button
            role="switch"
            :aria-checked="preferencesStore.jingleEnabled"
            :aria-label="'Jingle au lancement : ' + (preferencesStore.jingleEnabled ? 'activé' : 'désactivé')"
            class="toggle-switch"
            :class="{ active: preferencesStore.jingleEnabled }"
            :style="{
              backgroundColor: preferencesStore.jingleEnabled ? skinStore.colors.textPrimary : skinStore.colors.disabledControls,
              borderColor: skinStore.colors.accentMetallic
            }"
            @click="handleToggleJingle"
          >
            <span class="toggle-knob" :style="{ backgroundColor: skinStore.colors.background }" />
          </button>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prefs-overlay {
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

.prefs-panel {
  border: 1px solid;
  padding: 0;
  min-width: 280px;
  max-width: 400px;
  font-family: 'Courier New', monospace;
}

.prefs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid;
}

.prefs-title {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
}

.prefs-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.prefs-body {
  padding: 12px;
}

.pref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 6px 0;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  width: 36px;
  height: 18px;
  border: 1px solid;
  border-radius: 9px;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.15s;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: transform 0.15s;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(18px);
}
</style>
