// [FormatValidator] Audio format validation
import { SUPPORTED_AUDIO_FORMATS } from './constants.js'

/**
 * Check if a file path has a supported audio format extension.
 * @param {string} filePath
 * @returns {boolean}
 */
export function isSupportedFormat(filePath) {
  if (!filePath || typeof filePath !== 'string') return false
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (!ext) return false
  return SUPPORTED_AUDIO_FORMATS.includes(ext)
}

/**
 * Extract just the file name from a full path.
 * @param {string} filePath
 * @returns {string}
 */
export function extractFileName(filePath) {
  if (!filePath) return ''
  return filePath.split('/').pop().split('\\').pop() || ''
}
