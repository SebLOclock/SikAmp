import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import { usePlayerStore } from './usePlayerStore'
import { isSupportedFormat, extractFileName } from '@/utils/formatValidator.js'

function extractTrackInfo(filePath) {
  const fileName = filePath.split('/').pop().split('\\').pop()
  const name = fileName.replace(/\.[^.]+$/, '')
  return {
    path: filePath,
    title: name,
    artist: 'Inconnu',
    duration: 0,
    bitrate: null,
    sampleRate: null,
    channels: null
  }
}

export const usePlaylistStore = defineStore('playlist', {
  state: () => ({
    tracks: [],
    currentIndex: -1,
    isShuffled: false,
    repeatMode: 'none', // 'none' | 'all' | 'one'
    _consecutiveErrors: 0,
    playlistName: null,
    playlistPath: null
  }),

  getters: {
    currentTrack: (state) => {
      if (state.currentIndex >= 0 && state.currentIndex < state.tracks.length) {
        return state.tracks[state.currentIndex]
      }
      return null
    },

    trackCount: (state) => state.tracks.length,

    isEmpty: (state) => state.tracks.length === 0,

    canPlayPrevious: (state) => {
      if (state.tracks.length === 0 || state.currentIndex < 0) return false
      if (state.repeatMode === 'none') return state.currentIndex > 0
      return true
    }
  },

  actions: {
    init() {
      // Auto-advance is handled by playerStore.onEnded callback
    },

    addTracks(filePaths) {
      const newTracks = filePaths.map((fp) => extractTrackInfo(fp))
      const startIndex = this.tracks.length
      this.tracks.push(...newTracks)
      // Clear any persistent error feedback since new tracks are available
      const playerStore = usePlayerStore()
      playerStore.clearFeedback()
      this._consecutiveErrors = 0
      console.log(`[PlaylistStore] Added ${newTracks.length} tracks, total: ${this.tracks.length}`)
      this._enrichMetadata(startIndex, newTracks.length)
    },

    async _enrichMetadata(startIndex, count) {
      for (let i = 0; i < count; i++) {
        const trackIndex = startIndex + i
        if (trackIndex >= this.tracks.length) break
        const track = this.tracks[trackIndex]
        const expectedPath = track.path
        try {
          const meta = await invoke('get_audio_metadata', { path: expectedPath })
          // Post-await: verify track identity hasn't changed (playlist may have been modified)
          if (trackIndex >= this.tracks.length || this.tracks[trackIndex]?.path !== expectedPath)
            continue
          track.title = meta.title || track.title
          track.artist = meta.artist || 'Inconnu'
          track.duration = meta.duration || 0
          track.bitrate = meta.bitrate ?? null
          track.sampleRate = meta.sampleRate ?? null
          track.channels = meta.channels ?? null
        } catch (err) {
          console.warn(`[PlaylistStore] Metadata extraction failed for ${expectedPath}:`, err)
        }
      }
    },

    removeTrack(index) {
      if (index < 0 || index >= this.tracks.length) return
      const wasCurrentTrack = index === this.currentIndex
      const playerStore = usePlayerStore()
      const wasActive = playerStore.isPlaying || playerStore.isPaused

      this.tracks.splice(index, 1)

      if (wasCurrentTrack) {
        if (wasActive && this.tracks.length > 0) {
          // Advance to next track (now at same index after splice)
          const nextIndex = index < this.tracks.length ? index : this.tracks.length - 1
          this.currentIndex = nextIndex
          this.playTrack(nextIndex)
        } else if (wasActive) {
          // No tracks left, stop playback
          playerStore.stop()
          this.currentIndex = -1
        } else {
          this.currentIndex = -1
        }
      } else if (index < this.currentIndex) {
        this.currentIndex--
      }
      console.log('[PlaylistStore] Track removed, total:', this.tracks.length)
    },

    moveTrack(fromIndex, toIndex) {
      if (fromIndex === toIndex) return
      if (fromIndex < 0 || fromIndex >= this.tracks.length) return
      if (toIndex < 0 || toIndex >= this.tracks.length) return

      const [track] = this.tracks.splice(fromIndex, 1)
      this.tracks.splice(toIndex, 0, track)

      // Update currentIndex to follow the currently playing track
      if (this.currentIndex === fromIndex) {
        this.currentIndex = toIndex
      } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
        this.currentIndex--
      } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
        this.currentIndex++
      }

      console.log(`[PlaylistStore] Track moved from ${fromIndex} to ${toIndex}`)
    },

    newPlaylist() {
      const playerStore = usePlayerStore()
      playerStore.stop()
      this.tracks = []
      this.currentIndex = -1
      this._consecutiveErrors = 0
      this.playlistName = null
      this.playlistPath = null
      console.log('[PlaylistStore] New playlist created')
    },

    clearPlaylist() {
      const playerStore = usePlayerStore()
      playerStore.stop()
      this.tracks = []
      this.currentIndex = -1
      this._consecutiveErrors = 0
      this.playlistName = null
      this.playlistPath = null
      console.log('[PlaylistStore] Playlist cleared')
    },

    async playTrack(index) {
      if (index < 0 || index >= this.tracks.length) return
      this.currentIndex = index
      const track = this.tracks[index]
      const playerStore = usePlayerStore()

      // PRE-CHECK: skip missing tracks
      if (track.missing) {
        console.warn(`[PlaylistStore] Skipping missing track: ${track.title}`)
        this._handlePlaybackError()
        return
      }

      // PRE-CHECK: validate format before attempting playback
      if (!isSupportedFormat(track.path)) {
        const fileName = extractFileName(track.path)
        console.warn(`[PlaylistStore] Unsupported format: ${fileName}`)
        playerStore.showFeedback(`Format non supporté : ${fileName}`, 'error')
        this._handlePlaybackError()
        return
      }

      await playerStore.play(track.path)
      // _consecutiveErrors is reset in onLoadedMetadata (reliable success signal)
      // Async errors (corrupt/missing) handled by audioEngine.onError → _handlePlaybackError
      console.log('[PlaylistStore] Playing track:', track.title)
    },

    async _handlePlaybackError() {
      this._consecutiveErrors++

      // Anti-infinite-loop: if we've tried all tracks, stop
      if (this._consecutiveErrors >= this.tracks.length) {
        console.warn(`[PlaylistStore] All ${this.tracks.length} tracks failed, stopping`)
        const playerStore = usePlayerStore()
        playerStore.isPlaying = false
        playerStore.isPaused = false
        // Keep the last error message visible (persistent)
        if (playerStore.feedbackMessage) {
          playerStore.showFeedback(playerStore.feedbackMessage.text, 'error', true)
        }
        return
      }

      await this.playNext()
    },

    async playNext() {
      if (this.tracks.length === 0) return

      if (this.repeatMode === 'one') {
        this.playTrack(this.currentIndex)
        return
      }

      let nextIndex = this.currentIndex + 1
      if (nextIndex >= this.tracks.length) {
        if (this.repeatMode === 'all') {
          nextIndex = 0
        } else {
          console.log('[PlaylistStore] End of playlist reached')
          return
        }
      }

      // Attempt crossfade for manual next
      const playerStore = usePlayerStore()
      if (playerStore.isPlaying) {
        const crossfaded = await playerStore._handleManualCrossfadeNext()
        if (crossfaded) return
      }

      this.playTrack(nextIndex)
    },

    playPrevious() {
      if (this.tracks.length === 0) return
      if (this.currentIndex < 0) return

      if (this.repeatMode === 'one') {
        this.playTrack(this.currentIndex)
        return
      }

      let prevIndex = this.currentIndex - 1
      if (prevIndex < 0) {
        if (this.repeatMode === 'all') {
          prevIndex = this.tracks.length - 1
        } else {
          return // ne rien faire en mode 'none' au début de la playlist
        }
      }
      this.playTrack(prevIndex)
    },

    peekNextTrack() {
      if (this.tracks.length === 0 || this.currentIndex < 0) return null

      if (this.repeatMode === 'one') {
        return { track: this.tracks[this.currentIndex], index: this.currentIndex }
      }

      let nextIndex = this.currentIndex + 1
      if (nextIndex >= this.tracks.length) {
        if (this.repeatMode === 'all') {
          nextIndex = 0
        } else {
          return null // End of playlist in 'none' mode
        }
      }
      return { track: this.tracks[nextIndex], index: nextIndex }
    },

    getNextTrack() {
      if (this.tracks.length === 0) return null
      const nextIndex = (this.currentIndex + 1) % this.tracks.length
      return this.tracks[nextIndex]
    },

    getPreviousTrack() {
      if (this.tracks.length === 0) return null
      const prevIndex = this.currentIndex <= 0 ? this.tracks.length - 1 : this.currentIndex - 1
      return this.tracks[prevIndex]
    },

    async savePlaylist() {
      if (this.tracks.length === 0) return

      const playerStore = usePlayerStore()

      let savePath = this.playlistPath
      if (!savePath) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog')
          savePath = await save({
            filters: [{ name: 'Playlist', extensions: ['m3u8'] }],
            defaultPath: 'ma-playlist.m3u8'
          })
        } catch (err) {
          console.warn('[PlaylistStore] Save dialog error:', err)
          return
        }
        if (!savePath) return // user cancelled
      }

      const tracksData = this.tracks.map((t) => ({
        path: t.path,
        title: t.title || '',
        artist: t.artist || '',
        duration: t.duration || 0
      }))

      try {
        await invoke('save_playlist', { path: savePath, tracks: tracksData })
        this.playlistPath = savePath
        // Extract name from path
        const fileName = savePath
          .split('/')
          .pop()
          .split('\\')
          .pop()
          .replace(/\.m3u8?$/i, '')
        this.playlistName = fileName
        console.log('[PlaylistStore] Playlist saved:', savePath)
        playerStore.showFeedback('Playlist sauvegardée', 'success')
      } catch (err) {
        console.warn('[PlaylistStore] Failed to save:', err)
        playerStore.showFeedback('Erreur de sauvegarde', 'error')
      }
    },

    async openFiles() {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog')
        const result = await open({
          filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac'] }],
          multiple: true
        })
        if (!result) return
        const paths = Array.isArray(result) ? result : [result]
        if (paths.length > 0) {
          this.addTracks(paths)
          console.log(`[PlaylistStore] Opened ${paths.length} files via dialog`)
        }
      } catch (err) {
        console.warn('[PlaylistStore] Open files dialog error:', err)
        const playerStore = usePlayerStore()
        playerStore.showFeedback("Erreur d'ouverture de fichiers", 'error')
      }
    },

    async openFolder() {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog')
        const dir = await open({ directory: true })
        if (!dir) return
        const files = await invoke('resolve_audio_paths', { paths: [dir] })
        if (files.length > 0) {
          this.addTracks(files)
          console.log(`[PlaylistStore] Opened folder: ${files.length} files from ${dir}`)
        }
      } catch (err) {
        console.warn('[PlaylistStore] Open folder dialog error:', err)
        const playerStore = usePlayerStore()
        playerStore.showFeedback("Erreur d'ouverture du dossier", 'error')
      }
    },

    async loadPlaylist() {
      const playerStore = usePlayerStore()

      let filePath
      try {
        const { open } = await import('@tauri-apps/plugin-dialog')
        filePath = await open({
          filters: [{ name: 'Playlist', extensions: ['m3u', 'm3u8'] }],
          multiple: false
        })
      } catch (err) {
        console.warn('[PlaylistStore] Open dialog error:', err)
        return
      }
      if (!filePath) return // user cancelled

      try {
        const entries = await invoke('load_playlist', { path: filePath })

        // Replace current playlist
        playerStore.stop()
        this.tracks = entries.map((e) => ({
          path: e.path,
          title:
            e.title ||
            e.path
              .split('/')
              .pop()
              .split('\\')
              .pop()
              .replace(/\.[^.]+$/, ''),
          artist: e.artist || 'Inconnu',
          duration: e.duration || 0,
          bitrate: null,
          sampleRate: null,
          channels: null,
          missing: !e.exists
        }))
        this.currentIndex = -1
        this._consecutiveErrors = 0

        // Set playlist path/name
        this.playlistPath = filePath
        const fileName = filePath
          .split('/')
          .pop()
          .split('\\')
          .pop()
          .replace(/\.m3u8?$/i, '')
        this.playlistName = fileName

        console.log(`[PlaylistStore] Playlist loaded: ${filePath}, ${entries.length} tracks`)
        playerStore.showFeedback(`Playlist chargée, ${entries.length} morceaux`, 'success')

        // Enrich metadata for existing (non-missing) tracks only
        const nonMissingTracks = this.tracks.filter((t) => !t.missing)
        if (nonMissingTracks.length > 0) {
          for (let i = 0; i < this.tracks.length; i++) {
            if (!this.tracks[i].missing) {
              this._enrichMetadata(i, 1)
            }
          }
        }
      } catch (err) {
        console.warn('[PlaylistStore] Failed to load:', err)
        playerStore.showFeedback('Erreur de chargement', 'error')
      }
    }

    // Auto-advance is now handled by playerStore.onEnded callback
    // which works with both dual-source audio elements
  }
})
