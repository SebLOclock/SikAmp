<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkinStore } from '@/stores/useSkinStore'
import { setupCanvas, drawBackground, drawButton, drawSlider, drawBitmapText } from '@/engine/skinRenderer'

const canvasRef = ref(null)
const playerStore = usePlayerStore()
const skinStore = useSkinStore()

const CANVAS_WIDTH = 220
const CANVAS_HEIGHT = 36

const ICON_ZONE = { x: 6, y: 6, w: 30, h: 24 }
const SLIDER_ZONE = { x: 44, y: 10, w: 160, h: 16 }

const isMuted = ref(false)
const volumeBeforeMute = ref(0.8)
let isDragging = false

const volumeIcon = computed(() => {
  if (isMuted.value || playerStore.volume === 0) return 'X'
  if (playerStore.volume <= 0.33) return ')'
  if (playerStore.volume <= 0.66) return '))'
  return ')))'
})

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = setupCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, skinStore.renderMode)

  drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Volume icon button
  drawButton(ctx, ICON_ZONE.x, ICON_ZONE.y, ICON_ZONE.w, ICON_ZONE.h, 'normal')
  drawBitmapText(ctx, volumeIcon.value, ICON_ZONE.x + 6, ICON_ZONE.y + 6, 11, null, skinStore.colors.textPrimary)

  // Volume slider
  const vol = isMuted.value ? 0 : playerStore.volume
  drawSlider(ctx, SLIDER_ZONE.x, SLIDER_ZONE.y, SLIDER_ZONE.w, SLIDER_ZONE.h, vol, 0, 1)
}

function getVolumeFromX(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const canvasX = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
  const ratio = (canvasX - SLIDER_ZONE.x) / SLIDER_ZONE.w
  return Math.max(0, Math.min(1, ratio))
}

function handleMouseDown(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const canvasX = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
  const canvasY = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

  // Click on icon = toggle mute
  if (canvasX >= ICON_ZONE.x && canvasX <= ICON_ZONE.x + ICON_ZONE.w &&
      canvasY >= ICON_ZONE.y && canvasY <= ICON_ZONE.y + ICON_ZONE.h) {
    toggleMute()
    return
  }

  // Click on slider area
  if (canvasX >= SLIDER_ZONE.x && canvasX <= SLIDER_ZONE.x + SLIDER_ZONE.w) {
    isDragging = true
    if (isMuted.value) isMuted.value = false
    const vol = getVolumeFromX(event)
    playerStore.setVolume(vol)
    draw()
    document.addEventListener('mousemove', handleDocMouseMove)
    document.addEventListener('mouseup', handleDocMouseUp)
  }
}

function handleDocMouseMove(event) {
  if (!isDragging) return
  const vol = getVolumeFromX(event)
  playerStore.setVolume(vol)
  draw()
}

function handleDocMouseUp() {
  isDragging = false
  document.removeEventListener('mousemove', handleDocMouseMove)
  document.removeEventListener('mouseup', handleDocMouseUp)
}

function toggleMute() {
  if (isMuted.value) {
    isMuted.value = false
    playerStore.setVolume(volumeBeforeMute.value)
  } else {
    volumeBeforeMute.value = playerStore.volume
    isMuted.value = true
    playerStore.setVolume(0)
  }
  draw()
}

function handleAccessibleInput(event) {
  const vol = Number(event.target.value) / 100
  if (isMuted.value) isMuted.value = false
  playerStore.setVolume(vol)
}

onMounted(() => draw())
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDocMouseMove)
  document.removeEventListener('mouseup', handleDocMouseUp)
})

watch(
  () => [playerStore.volume, skinStore.renderMode],
  () => { if (!isDragging) draw() }
)
</script>

<template>
  <div class="canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="volume-canvas"
      @mousedown="handleMouseDown"
    />
    <!-- Accessible slider -->
    <input
      type="range"
      class="sr-only-overlay"
      min="0"
      max="100"
      :value="Math.round(playerStore.volume * 100)"
      aria-label="Volume"
      @input="handleAccessibleInput"
    />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
}
.volume-canvas {
  display: block;
  width: 100%;
}
.sr-only-overlay {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  left: 44px;
  top: 0;
  width: 160px;
  height: 100%;
}
</style>
