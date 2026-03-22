import { describe, it, expect } from 'vitest'
import { isSupportedFormat, extractFileName } from './formatValidator.js'

describe('isSupportedFormat', () => {
  it('returns true for supported formats', () => {
    expect(isSupportedFormat('/music/track.mp3')).toBe(true)
    expect(isSupportedFormat('/music/track.wav')).toBe(true)
    expect(isSupportedFormat('/music/track.ogg')).toBe(true)
    expect(isSupportedFormat('/music/track.flac')).toBe(true)
  })

  it('returns true for uppercase extensions', () => {
    expect(isSupportedFormat('/music/track.MP3')).toBe(true)
    expect(isSupportedFormat('/music/track.FLAC')).toBe(true)
  })

  it('returns false for unsupported formats', () => {
    expect(isSupportedFormat('/music/track.wma')).toBe(false)
    expect(isSupportedFormat('/music/track.aac')).toBe(false)
    expect(isSupportedFormat('/music/track.m4a')).toBe(false)
    expect(isSupportedFormat('/music/track.mid')).toBe(false)
  })

  it('returns false for non-audio files', () => {
    expect(isSupportedFormat('/docs/readme.txt')).toBe(false)
    expect(isSupportedFormat('/images/photo.jpg')).toBe(false)
  })

  it('returns false for invalid inputs', () => {
    expect(isSupportedFormat(null)).toBe(false)
    expect(isSupportedFormat(undefined)).toBe(false)
    expect(isSupportedFormat('')).toBe(false)
    expect(isSupportedFormat(123)).toBe(false)
  })

  it('handles paths with multiple dots', () => {
    expect(isSupportedFormat('/music/my.best.track.mp3')).toBe(true)
    expect(isSupportedFormat('/music/my.best.track.wma')).toBe(false)
  })
})

describe('extractFileName', () => {
  it('extracts filename from unix path', () => {
    expect(extractFileName('/music/albums/track.mp3')).toBe('track.mp3')
  })

  it('extracts filename from windows path', () => {
    expect(extractFileName('C:\\Music\\track.mp3')).toBe('track.mp3')
  })

  it('handles empty or null input', () => {
    expect(extractFileName(null)).toBe('')
    expect(extractFileName('')).toBe('')
    expect(extractFileName(undefined)).toBe('')
  })

  it('returns filename when no path separator', () => {
    expect(extractFileName('track.mp3')).toBe('track.mp3')
  })
})
