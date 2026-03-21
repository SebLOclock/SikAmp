<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'
import { setupCanvas, drawBackground, drawButton } from '@/engine/skinRenderer'

const canvasRef = ref(null)
const skinStore = useSkinStore()

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 28

const BTN_W = 50
const BTN_H = 20
const BTN_Y = 4
const BTN_GAP = 6
const BTN_START_X = 16

const toggleState = ref({
  shuffle: false,
  repeat: false,
  crossfade: false
})

const BUTTONS = [
  { id: 'shuffle', label: 'SHF', x: BTN_START_X, toggle: true },
  { id: 'repeat', label: 'RPT', x: BTN_START_X + (BTN_W + BTN_GAP), toggle: true },
  { id: 'crossfade', label: 'XFD', x: BTN_START_X + (BTN_W + BTN_GAP) * 2, toggle: true },
  { id: 'skins', label: 'SKN', x: BTN_START_X + (BTN_W + BTN_GAP) * 3, toggle: false },
  { id: 'prefs', label: 'PRF', x: BTN_START_X + (BTN_W + BTN_GAP) * 4, toggle: false }
]

const hoveredButton = ref(null)
const pressedButton = ref(null)

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = setupCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, skinStore.renderMode)

  drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Top border
  ctx.fillStyle = skinStore.colors.darkEdge
  ctx.fillRect(0, 0, CANVAS_WIDTH, 1)

  for (const btn of BUTTONS) {
    let state = 'normal'
    if (pressedButton.value === btn.id) state = 'pressed'
    else if (hoveredButton.value === btn.id) state = 'hover'

    drawButton(ctx, btn.x, BTN_Y, BTN_W, BTN_H, state, btn.label)

    // Toggle ON indicator — green bar at bottom
    if (btn.toggle && toggleState.value[btn.id]) {
      ctx.fillStyle = skinStore.colors.textPrimary
      ctx.fillRect(btn.x + 4, BTN_Y + BTN_H - 4, BTN_W - 8, 3)
    }
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
  if (btn && btn === pressedButton.value) {
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

function executeAction(btnId) {
  const btn = BUTTONS.find(b => b.id === btnId)
  if (btn && btn.toggle) {
    toggleState.value[btnId] = !toggleState.value[btnId]
    console.log(`[ActionBar] ${btnId} toggled:`, toggleState.value[btnId])
  } else {
    console.log(`[ActionBar] ${btnId} clicked (stub)`)
  }
}

onMounted(() => draw())
watch(() => skinStore.renderMode, () => draw())
</script>

<template>
  <div class="canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="actionbar-canvas"
      @mousemove="handleMouseMove"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    />
    <!-- Accessible toggle buttons -->
    <button
      v-for="btn in BUTTONS.filter(b => b.toggle)"
      :key="btn.id"
      class="sr-only-btn"
      role="switch"
      :aria-checked="toggleState[btn.id]"
      :aria-label="btn.label"
      @click="executeAction(btn.id); draw()"
    />
    <button
      v-for="btn in BUTTONS.filter(b => !b.toggle)"
      :key="btn.id"
      class="sr-only-btn"
      :aria-label="btn.label"
      @click="executeAction(btn.id)"
    />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
}
.actionbar-canvas {
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
