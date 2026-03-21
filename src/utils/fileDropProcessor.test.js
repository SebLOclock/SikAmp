import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInvoke = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args) => mockInvoke(...args)
}))

describe('fileDropProcessor', () => {
  let processDroppedPaths

  beforeEach(async () => {
    vi.resetModules()
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue([])

    const mod = await import('./fileDropProcessor.js')
    processDroppedPaths = mod.processDroppedPaths
  })

  describe('file filtering', () => {
    it('accepts mp3 files as direct files', async () => {
      const { directFiles } = await processDroppedPaths(['/music/song.mp3'])
      expect(directFiles).toEqual(['/music/song.mp3'])
    })

    it('accepts flac files as direct files', async () => {
      const { directFiles } = await processDroppedPaths(['/music/song.flac'])
      expect(directFiles).toEqual(['/music/song.flac'])
    })

    it('accepts wav files as direct files', async () => {
      const { directFiles } = await processDroppedPaths(['/music/song.wav'])
      expect(directFiles).toEqual(['/music/song.wav'])
    })

    it('accepts ogg files as direct files', async () => {
      const { directFiles } = await processDroppedPaths(['/music/song.ogg'])
      expect(directFiles).toEqual(['/music/song.ogg'])
    })

    it('sends unsupported extensions to backend for resolution', async () => {
      await processDroppedPaths(['/doc/readme.txt', '/img/photo.jpg', '/data.pdf'])
      expect(mockInvoke).toHaveBeenCalledWith('resolve_audio_paths', {
        paths: ['/doc/readme.txt', '/img/photo.jpg', '/data.pdf']
      })
    })

    it('handles mixed supported and unsupported files', async () => {
      const { directFiles } = await processDroppedPaths([
        '/music/song.mp3',
        '/doc/readme.txt',
        '/music/track.flac',
        '/img/photo.jpg'
      ])
      expect(directFiles).toEqual(['/music/song.mp3', '/music/track.flac'])
    })

    it('is case-insensitive for extensions', async () => {
      const { directFiles } = await processDroppedPaths(['/music/song.MP3', '/music/track.Flac'])
      expect(directFiles).toEqual(['/music/song.MP3', '/music/track.Flac'])
    })
  })

  describe('path resolution via backend', () => {
    it('resolves non-audio paths via resolve_audio_paths command', async () => {
      mockInvoke.mockResolvedValue(['/music/dir/a.mp3', '/music/dir/b.ogg'])

      const { resolvedFiles } = await processDroppedPaths(['/music/dir'])
      expect(mockInvoke).toHaveBeenCalledWith('resolve_audio_paths', { paths: ['/music/dir'] })
      expect(resolvedFiles).toEqual(['/music/dir/a.mp3', '/music/dir/b.ogg'])
    })

    it('handles backend resolution failure gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('permission denied'))

      const { resolvedFiles, allFiles } = await processDroppedPaths(['/music/dir'])
      expect(resolvedFiles).toEqual([])
      expect(allFiles).toEqual([])
    })

    it('combines direct files and resolved files in allFiles', async () => {
      mockInvoke.mockResolvedValue(['/music/dir/c.wav'])

      const { directFiles, resolvedFiles, allFiles } = await processDroppedPaths(['/music/song.mp3', '/music/dir'])
      expect(directFiles).toEqual(['/music/song.mp3'])
      expect(resolvedFiles).toEqual(['/music/dir/c.wav'])
      expect(allFiles).toEqual(['/music/song.mp3', '/music/dir/c.wav'])
    })

    it('sends extensionless paths to backend (not assumed as directories)', async () => {
      await processDroppedPaths(['/music/LICENSE', '/music/Makefile'])
      expect(mockInvoke).toHaveBeenCalledWith('resolve_audio_paths', {
        paths: ['/music/LICENSE', '/music/Makefile']
      })
    })

    it('sends dotted directory names to backend', async () => {
      await processDroppedPaths(['/music/album.2024'])
      expect(mockInvoke).toHaveBeenCalledWith('resolve_audio_paths', {
        paths: ['/music/album.2024']
      })
    })
  })

  describe('edge cases', () => {
    it('returns empty results for empty input', async () => {
      const { directFiles, resolvedFiles, allFiles } = await processDroppedPaths([])
      expect(directFiles).toEqual([])
      expect(resolvedFiles).toEqual([])
      expect(allFiles).toEqual([])
    })

    it('does not call backend when all paths are direct audio files', async () => {
      await processDroppedPaths(['/music/a.mp3', '/music/b.ogg'])
      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })
})
