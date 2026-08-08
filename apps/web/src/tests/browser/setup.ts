import { afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@/styles.css'

beforeAll(async () => {
  await Promise.all([
    document.fonts.load('400 16px "Cabinet Grotesk"'),
    document.fonts.load('700 48px "Cabinet Grotesk"'),
  ])
  await document.fonts.ready
})

afterEach(() => {
  cleanup()
})
