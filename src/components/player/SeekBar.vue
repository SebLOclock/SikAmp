<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkinStore } from '@/stores/useSkinStore'
import { setupCanvas, drawBackground, drawSlider } from '@/engine/skinRenderer'

const canvasRef = ref(null)
const playerStore = usePlayerStore()
const skinStore = useSkinStore()

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 22

let isDragging = false

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = setupCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, skinStore.renderMode)

  drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawSlider(ctx, 8, 5, CANVAS_WIDTH - 16, 12, playerStore.currentTime, 0, playerStore.duration || 1)
}

function getTimeFromX(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const ratio = Math.max(0, Math.min(1, x))
  return ratio * (playerStore.duration || 0)
}

function handleMouseDown(event) {
  isDragging = true
  const time = getTimeFromX(event)
  playerStore.seek(time)
  draw()
  document.addEventListener('mousemove', handleDocMouseMove)
  document.addEventListener('mouseup', handleDocMouseUp)
}

function handleDocMouseMove(event) {
  if (!isDragging) return
  const time = getTimeFromX(event)
  playerStore.seek(time)
  draw()
}

function handleDocMouseUp() {
  isDragging = false
  document.removeEventListener('mousemove', handleDocMouseMove)
  document.removeEventListener('mouseup', handleDocMouseUp)
}

onMounted(() => draw())
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDocMouseMove)
  document.removeEventListener('mouseup', handleDocMouseUp)
})

watch(
  () => [playerStore.currentTime, playerStore.duration, skinStore.renderMode],
  () => { if (!isDragging) draw() }
)
</script>

<template>
  <div class="canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="seekbar-canvas"
      @mousedown="handleMouseDown"
    />
    <!-- Accessible slider -->
    <input
      type="range"
      class="sr-only-overlay"
      :min="0"
      :max="Math.floor(playerStore.duration || 0)"
      :value="Math.floor(playerStore.currentTime)"
      aria-label="Position de lecture"
      @input="(e) => playerStore.seek(Number(e.target.value))"
    />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
}
.seekbar-canvas {
  display: block;
  width: 100%;
  cursor: pointer;
}
.sr-only-overlay {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>
