<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { MIN_CROSSFADE_DURATION, MAX_CROSSFADE_DURATION } from '@/utils/constants'

const skinStore = useSkinStore()
const preferencesStore = usePreferencesStore()
const overlayRef = ref(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await nextTick()
      activateTrap(overlayRef.value)
    } else {
      deactivateTrap()
    }
  }
)

function handleToggleJingle() {
  preferencesStore.toggleJingle()
}

const isModernMode = computed(() => skinStore.renderMode === 'modern')

function handleToggleCrossfade() {
  preferencesStore.setCrossfadeEnabled(!preferencesStore.crossfadeEnabled)
}

function handleCrossfadeDurationChange(event) {
  const seconds = Number(event.target.value)
  preferencesStore.setCrossfadeDuration(seconds)
}

function handleToggleRenderMode() {
  const newMode = isModernMode.value ? 'retro' : 'modern'
  skinStore.setRenderMode(newMode)
  preferencesStore.setRenderMode(newMode)
}
</script>

<template>
  <Transition :name="isModernMode ? 'overlay-fade' : ''">
    <div
      v-if="visible"
      ref="overlayRef"
      class="prefs-overlay overlay-panel"
      tabindex="-1"
      :style="{ backgroundColor: skinStore.colors.displayBg + 'EE' }"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div
        class="prefs-panel"
        :style="{
          backgroundColor: skinStore.colors.background,
          borderColor: skinStore.colors.accentMetallic
        }"
      >
        <div class="prefs-header" :style="{ borderBottomColor: skinStore.colors.accentMetallic }">
          <span class="prefs-title" :style="{ color: skinStore.colors.textPrimary }"
            >PREFERENCES</span
          >
          <button
            class="prefs-close"
            :style="{ color: skinStore.colors.textPrimary }"
            aria-label="Fermer les préférences"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
        <div class="prefs-body">
          <label class="pref-row" :style="{ color: skinStore.colors.textSecondary }">
            <span>Fondu enchaîné</span>
            <button
              role="switch"
              :aria-checked="preferencesStore.crossfadeEnabled"
              :aria-label="
                'Fondu enchaîné : ' + (preferencesStore.crossfadeEnabled ? 'activé' : 'désactivé')
              "
              class="toggle-switch"
              :class="{ active: preferencesStore.crossfadeEnabled }"
              :style="{
                backgroundColor: preferencesStore.crossfadeEnabled
                  ? skinStore.colors.textPrimary
                  : skinStore.colors.disabledControls,
                borderColor: skinStore.colors.accentMetallic
              }"
              @click="handleToggleCrossfade"
            >
              <span class="toggle-knob" :style="{ backgroundColor: skinStore.colors.background }" />
            </button>
          </label>
          <div
            class="pref-row pref-slider-row"
            :style="{
              color: skinStore.colors.textSecondary,
              opacity: preferencesStore.crossfadeEnabled ? 1 : 0.4,
              cursor: preferencesStore.crossfadeEnabled ? 'default' : 'not-allowed'
            }"
          >
            <span>Durée du fondu</span>
            <div class="slider-group">
              <input
                type="range"
                :min="MIN_CROSSFADE_DURATION"
                :max="MAX_CROSSFADE_DURATION"
                step="1"
                :value="preferencesStore.crossfadeDuration"
                :disabled="!preferencesStore.crossfadeEnabled"
                :aria-valuemin="MIN_CROSSFADE_DURATION"
                :aria-valuemax="MAX_CROSSFADE_DURATION"
                :aria-valuenow="preferencesStore.crossfadeDuration"
                :aria-label="
                  'Durée du fondu enchaîné : ' + preferencesStore.crossfadeDuration + ' secondes'
                "
                class="crossfade-slider"
                :style="{
                  '--slider-thumb-color': skinStore.colors.textPrimary,
                  '--slider-track-color': preferencesStore.crossfadeEnabled
                    ? skinStore.colors.accentMetallic
                    : skinStore.colors.disabledControls
                }"
                @input="handleCrossfadeDurationChange"
              />
              <span class="slider-value" :style="{ color: skinStore.colors.textPrimary }"
                >{{ preferencesStore.crossfadeDuration }}s</span
              >
            </div>
          </div>
          <label class="pref-row" :style="{ color: skinStore.colors.textSecondary }">
            <span>Jingle au lancement</span>
            <button
              role="switch"
              :aria-checked="preferencesStore.jingleEnabled"
              :aria-label="
                'Jingle au lancement : ' + (preferencesStore.jingleEnabled ? 'activé' : 'désactivé')
              "
              class="toggle-switch"
              :class="{ active: preferencesStore.jingleEnabled }"
              :style="{
                backgroundColor: preferencesStore.jingleEnabled
                  ? skinStore.colors.textPrimary
                  : skinStore.colors.disabledControls,
                borderColor: skinStore.colors.accentMetallic
              }"
              @click="handleToggleJingle"
            >
              <span class="toggle-knob" :style="{ backgroundColor: skinStore.colors.background }" />
            </button>
          </label>
          <label class="pref-row" :style="{ color: skinStore.colors.textSecondary }">
            <span>Mode de rendu</span>
            <div class="render-mode-toggle">
              <span
                class="render-mode-label"
                :style="{
                  color: !isModernMode
                    ? skinStore.colors.textPrimary
                    : skinStore.colors.disabledControls
                }"
                >Rétro</span
              >
              <button
                role="switch"
                :aria-checked="isModernMode"
                :aria-label="'Mode de rendu : ' + (isModernMode ? 'Moderne' : 'Rétro')"
                class="toggle-switch"
                :class="{ active: isModernMode }"
                :style="{
                  backgroundColor: isModernMode
                    ? skinStore.colors.textPrimary
                    : skinStore.colors.disabledControls,
                  borderColor: skinStore.colors.accentMetallic
                }"
                @click="handleToggleRenderMode"
              >
                <span
                  class="toggle-knob"
                  :style="{ backgroundColor: skinStore.colors.background }"
                />
              </button>
              <span
                class="render-mode-label"
                :style="{
                  color: isModernMode
                    ? skinStore.colors.textPrimary
                    : skinStore.colors.disabledControls
                }"
                >Moderne</span
              >
            </div>
          </label>
        </div>
      </div>
    </div>
  </Transition>
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

.render-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.render-mode-label {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.pref-slider-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 6px 0;
  transition: opacity 0.15s;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crossfade-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 4px;
  border-radius: 2px;
  background: var(--slider-track-color);
  outline: none;
}

.crossfade-slider:focus-visible {
  outline: 2px solid var(--slider-thumb-color);
  outline-offset: 4px;
  border-radius: 2px;
}

.crossfade-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--slider-thumb-color);
  cursor: inherit;
}

.crossfade-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--slider-thumb-color);
  border: none;
  cursor: inherit;
}

.crossfade-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: var(--slider-track-color);
}

.slider-value {
  font-size: 11px;
  font-weight: bold;
  min-width: 24px;
  text-align: right;
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
