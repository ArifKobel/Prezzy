import { afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@/styles.css'

beforeAll(async () => {
  await Promise.all([
    document.fonts.load('400 16px "Inter Variable"'),
    document.fonts.load('700 48px "Manrope Variable"'),
  ])
  await document.fonts.ready
})

afterEach(() => {
  cleanup()
})
