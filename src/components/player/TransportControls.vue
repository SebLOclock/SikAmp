<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useSkinStore } from '@/stores/useSkinStore'
import { setupCanvas, drawBackground, drawButton } from '@/engine/skinRenderer'

const canvasRef = ref(null)
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const skinStore = useSkinStore()

const CANVAS_WIDTH = 580
const CANVAS_HEIGHT = 36

const BTN_W = 46
const BTN_H = 28
const BTN_Y = 4
const BTN_GAP = 6
const BTN_START_X = 170

const BUTTONS = [
  { id: 'prev', label: '|◁', x: BTN_START_X },
  { id: 'play', label: '▷', x: BTN_START_X + (BTN_W + BTN_GAP) },
  { id: 'pause', label: '||', x: BTN_START_X + (BTN_W + BTN_GAP) * 2 },
  { id: 'stop', label: '□', x: BTN_START_X + (BTN_W + BTN_GAP) * 3 },
  { id: 'next', label: '▷|', x: BTN_START_X + (BTN_W + BTN_GAP) * 4 }
]

const hoveredButton = ref(null)
const pressedButton = ref(null)

const isDisabled = computed(() => {
  return playlistStore.isEmpty || (playerStore.isStopped && !playerStore.currentTrack)
})

const isPrevDisabled = computed(() => {
  return isDisabled.value || !playlistStore.canPlayPrevious
})

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = setupCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, skinStore.renderMode)

  drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)

  for (const btn of BUTTONS) {
    let state = 'normal'
    const btnDisabled = btn.id === 'prev' ? isPrevDisabled.value : isDisabled.value
    if (btnDisabled) state = 'disabled'
    else if (pressedButton.value === btn.id) state = 'pressed'
    else if (hoveredButton.value === btn.id) state = 'hover'
    drawButton(ctx, btn.x, BTN_Y, BTN_W, BTN_H, state, btn.label)
  }
}

function getMousePos(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
    y: (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
  }
}

function findButton(x, y) {
  for (const btn of BUTTONS) {
    if (x >= btn.x && x <= btn.x + BTN_W && y >= BTN_Y && y <= BTN_Y + BTN_H) {
      return btn.id
    }
  }
  return null
}

function handleMouseMove(event) {
  const { x, y } = getMousePos(event)
  hoveredButton.value = findButton(x, y)
  draw()
}

function handleMouseDown(event) {
  const { x, y } = getMousePos(event)
  pressedButton.value = findButton(x, y)
  draw()
}

function handleMouseUp(event) {
  const { x, y } = getMousePos(event)
  const btn = findButton(x, y)
  const btnDisabled = btn === 'prev' ? isPrevDisabled.value : isDisabled.value
  if (btn && btn === pressedButton.value && !btnDisabled) {
    executeAction(btn)
  }
  pressedButton.value = null
  draw()
}

function handleMouseLeave() {
  hoveredButton.value = null
  pressedButton.value = null
  draw()
}

const emit = defineEmits(['prev', 'next'])

function executeAction(btnId) {
  switch (btnId) {
    case 'prev':
      emit('prev')
      break
    case 'play':
      if (playerStore.isPaused) playerStore.resume()
      else if (playerStore.currentTrack) playerStore.play(playerStore.currentTrack.path)
      break
    case 'pause':
      playerStore.pause()
      break
    case 'stop':
      playerStore.stop()
      break
    case 'next':
      emit('next')
      break
  }
}

function accessibleAction(btnId) {
  const btnDisabled = btnId === 'prev' ? isPrevDisabled.value : isDisabled.value
  if (!btnDisabled) executeAction(btnId)
}

onMounted(() => draw())

watch(
  () => [playerStore.isPlaying, playerStore.isPaused, playerStore.currentTrack, skinStore.renderMode, playlistStore.canPlayPrevious, playlistStore.isEmpty],
  () => draw()
)
</script>

<template>
  <div class="canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="transport-canvas"
      @mousemove="handleMouseMove"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    />
    <!-- Accessible hidden buttons -->
    <button class="sr-only-btn" aria-label="Précédent" :disabled="isPrevDisabled" :aria-disabled="isPrevDisabled" @click="accessibleAction('prev')" />
    <button class="sr-only-btn" aria-label="Lecture" :disabled="isDisabled" :aria-disabled="isDisabled" @click="accessibleAction('play')" />
    <button class="sr-only-btn" aria-label="Pause" :disabled="isDisabled" :aria-disabled="isDisabled" @click="accessibleAction('pause')" />
    <button class="sr-only-btn" aria-label="Stop" :disabled="isDisabled" :aria-disabled="isDisabled" @click="accessibleAction('stop')" />
    <button class="sr-only-btn" aria-label="Suivant" :disabled="isDisabled" :aria-disabled="isDisabled" @click="accessibleAction('next')" />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
}
.transport-canvas {
  display: block;
  width: 100%;
}
.sr-only-btn {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  border: none;
  background: none;
  padding: 0;
}
</style>
