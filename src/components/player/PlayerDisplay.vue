<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useSkinStore } from '@/stores/useSkinStore'
import { setupCanvas, drawBitmapText, drawScrollingText, measureText } from '@/engine/skinRenderer'

const canvasRef = ref(null)
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const skinStore = useSkinStore()

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 110

const showRemaining = ref(false)
let scrollOffset = 0
let animationFrameId = null

const TITLE_FONT_SIZE = 14
const TIME_FONT_SIZE = 28
const INFO_FONT_SIZE = 11

// Time display hit zone
const TIME_ZONE = { x: 16, y: 36, w: 140, h: 36 }

const scrollingTitle = computed(() => {
  const track = currentTrack.value
  if (!track) return 'winamp-sik'
  const artist = track.artist && track.artist !== 'Inconnu' ? track.artist : ''
  const title = track.title || ''
  return artist ? `${artist} \u2014 ${title}` : title
})

const timeDisplay = computed(() => {
  if (showRemaining.value && playerStore.duration > 0) {
    const remaining = playerStore.duration - playerStore.currentTime
    return '-' + formatTimeDisplay(remaining)
  }
  return formatTimeDisplay(playerStore.currentTime)
})

const currentTrack = computed(() => playlistStore.currentTrack)

const bitrateInfo = computed(() => {
  if (!currentTrack.value?.bitrate) return ''
  return `${currentTrack.value.bitrate} kbps`
})

const frequencyInfo = computed(() => {
  if (!currentTrack.value?.sampleRate) return ''
  return `${(currentTrack.value.sampleRate / 1000).toFixed(1)} kHz`
})

const stereoMode = computed(() => {
  if (!currentTrack.value?.channels) return ''
  return currentTrack.value.channels >= 2 ? 'stereo' : 'mono'
})

function formatTimeDisplay(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = setupCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, skinStore.renderMode)

  // Display background (black)
  ctx.fillStyle = skinStore.colors.displayBg
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Subtle inset border
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, CANVAS_WIDTH, 1)
  ctx.fillRect(0, 0, 1, CANVAS_HEIGHT)
  ctx.fillStyle = '#333'
  ctx.fillRect(0, CANVAS_HEIGHT - 1, CANVAS_WIDTH, 1)
  ctx.fillRect(CANVAS_WIDTH - 1, 0, 1, CANVAS_HEIGHT)

  // Scrolling title
  drawScrollingText(
    ctx,
    scrollingTitle.value,
    12, 10,
    CANVAS_WIDTH - 24,
    scrollOffset,
    TITLE_FONT_SIZE, null,
    skinStore.colors.textPrimary
  )

  // Time display (large)
  drawBitmapText(ctx, timeDisplay.value, 20, 40, TIME_FONT_SIZE, null, skinStore.colors.textPrimary)

  // Bitrate, frequency, stereo info
  const infoY = 82
  drawBitmapText(ctx, bitrateInfo.value, 20, infoY, INFO_FONT_SIZE, null, skinStore.colors.textSecondary)
  drawBitmapText(ctx, frequencyInfo.value, 140, infoY, INFO_FONT_SIZE, null, skinStore.colors.textSecondary)
  drawBitmapText(ctx, stereoMode.value, 260, infoY, INFO_FONT_SIZE, null, skinStore.colors.textSecondary)
}

function animateScroll() {
  if (playerStore.isPlaying) {
    scrollOffset += 0.8
    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const textWidth = measureText(ctx, scrollingTitle.value, TITLE_FONT_SIZE)
      if (scrollOffset > textWidth + 60) {
        scrollOffset = 0
      }
    }
  }
  draw()
  animationFrameId = requestAnimationFrame(animateScroll)
}

function handleCanvasClick(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width)
  const y = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)

  if (x >= TIME_ZONE.x && x <= TIME_ZONE.x + TIME_ZONE.w &&
      y >= TIME_ZONE.y && y <= TIME_ZONE.y + TIME_ZONE.h) {
    showRemaining.value = !showRemaining.value
    draw()
  }
}

onMounted(() => {
  animateScroll()
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="display-canvas"
      @click="handleCanvasClick"
    />
    <!-- Accessible live region for screen readers -->
    <div class="sr-only" aria-live="polite" role="status">
      {{ scrollingTitle }} — {{ timeDisplay }}
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
}
.display-canvas {
  display: block;
  width: 100%;
  cursor: pointer;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
