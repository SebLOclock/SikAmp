import { invoke } from '@tauri-apps/api/core'
import { SUPPORTED_AUDIO_FORMATS } from '@/utils/constants.js'

function getExtension(filePath) {
  const dot = filePath.lastIndexOf('.')
  if (dot === -1) return ''
  return filePath.slice(dot + 1).toLowerCase()
}

function isSupportedAudio(filePath) {
  return SUPPORTED_AUDIO_FORMATS.includes(getExtension(filePath))
}

export function isWszFile(filePath) {
  return getExtension(filePath) === 'wsz'
}

/**
 * Process dropped paths by resolving them into audio file paths.
 * Also separates .wsz skin files from audio files.
 * - First yields directly-dropped audio files (instant)
 * - Then yields files found by resolving remaining paths via Rust backend
 *   (which handles directory detection, recursive scanning, and filtering)
 */
export async function processDroppedPaths(paths) {
  const directFiles = []
  const wszFiles = []
  const pathsToResolve = []

  for (const p of paths) {
    if (isWszFile(p)) {
      wszFiles.push(p)
    } else if (isSupportedAudio(p)) {
      directFiles.push(p)
    } else {
      // Let the backend determine if it's a directory, extensionless file, etc.
      pathsToResolve.push(p)
    }
  }

  // Resolve remaining paths (directories + unknown) via Rust
  let resolvedFiles = []
  if (pathsToResolve.length > 0) {
    try {
      resolvedFiles = await invoke('resolve_audio_paths', { paths: pathsToResolve })
    } catch (err) {
      console.warn('[FileDrop] Failed to resolve paths:', err)
    }
  }

  const allFiles = [...directFiles, ...resolvedFiles]
  console.log(`[FileDrop] Processed ${paths.length} paths → ${allFiles.length} audio files, ${wszFiles.length} skin files`)
  return { directFiles, resolvedFiles, allFiles, wszFiles }
}
