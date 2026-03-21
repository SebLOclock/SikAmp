<script setup>
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { usePlayerStore } from '@/stores/usePlayerStore.js'

const player = usePlayerStore()
const dirPath = ref('')
const files = ref([])
const error = ref('')

async function loadDirectory() {
  error.value = ''
  files.value = []
  if (!dirPath.value) {
    error.value = 'Entrez un chemin de dossier'
    return
  }
  try {
    files.value = await invoke('list_audio_files', { dirPath: dirPath.value })
  } catch (err) {
    error.value = `Erreur: ${err}`
  }
}

async function playFile(filePath) {
  await player.play(filePath)
}

function togglePause() {
  if (player.isPlaying) {
    player.pause()
  } else if (player.isPaused) {
    player.resume()
  }
}
</script>

<template>
  <div class="player-debug">
    <h2>PlayerDebug (temporaire)</h2>

    <div class="controls">
      <div class="dir-input">
        <input
          v-model="dirPath"
          type="text"
          placeholder="Chemin du dossier audio"
          @keyup.enter="loadDirectory"
        />
        <button @click="loadDirectory">Charger</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-if="files.length" class="file-list">
      <h3>Fichiers ({{ files.length }})</h3>
      <ul>
        <li v-for="file in files" :key="file">
          <button @click="playFile(file)">{{ file.split('/').pop() }}</button>
        </li>
      </ul>
    </div>

    <div class="playback-controls">
      <button :disabled="player.isStopped && !player.currentTrack" @click="togglePause">
        {{ player.isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button :disabled="player.isStopped" @click="player.stop()">Stop</button>
    </div>

    <div class="state-display">
      <h3>État du store</h3>
      <p><strong>isPlaying:</strong> {{ player.isPlaying }}</p>
      <p><strong>isPaused:</strong> {{ player.isPaused }}</p>
      <p><strong>isStopped:</strong> {{ player.isStopped }}</p>
      <p><strong>currentTrack:</strong> {{ player.currentTrack?.title || 'Aucun' }}</p>
      <p><strong>Temps:</strong> {{ player.formattedCurrentTime }} / {{ player.formattedDuration }}</p>
      <p><strong>Progression:</strong> {{ player.progressPercent.toFixed(1) }}%</p>
      <p><strong>Volume:</strong> {{ (player.volume * 100).toFixed(0) }}%</p>

      <div class="volume-control">
        <label>Volume:
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="player.volume"
            @input="player.setVolume(parseFloat($event.target.value))"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-debug {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: monospace;
}

.dir-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.dir-input input {
  flex: 1;
  padding: 6px 8px;
}

.error {
  color: red;
}

.file-list ul {
  list-style: none;
  padding: 0;
}

.file-list li {
  margin: 4px 0;
}

.file-list button {
  text-align: left;
  background: none;
  border: 1px solid #ccc;
  padding: 4px 8px;
  cursor: pointer;
  width: 100%;
}

.file-list button:hover {
  background: #eee;
}

.playback-controls {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.playback-controls button {
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
}

.state-display {
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
}

.state-display p {
  margin: 4px 0;
}
</style>
