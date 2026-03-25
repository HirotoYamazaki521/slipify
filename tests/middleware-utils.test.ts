import { describe, it, expect } from 'vitest'
import { isPublicPath, isApiPath } from '@/lib/supabase/middleware-utils'

describe('isPublicPath', () => {
  it('/login は公開パス', () => {
    expect(isPublicPath('/login')).toBe(true)
  })

  it('/signup は公開パス', () => {
    expect(isPublicPath('/signup')).toBe(true)
  })

  it('/ はプロテクトパス', () => {
    expect(isPublicPath('/')).toBe(false)
  })

  it('/dashboard はプロテクトパス', () => {
    expect(isPublicPath('/dashboard')).toBe(false)
  })

  it('/receipts はプロテクトパス', () => {
    expect(isPublicPath('/receipts')).toBe(false)
  })

  it('/api/receipts はプロテクトパス', () => {
    expect(isPublicPath('/api/receipts')).toBe(false)
  })
})

describe('isApiPath', () => {
  it('/api/receipts は API パス', () => {
    expect(isApiPath('/api/receipts')).toBe(true)
  })

  it('/api/exports/csv は API パス', () => {
    expect(isApiPath('/api/exports/csv')).toBe(true)
  })

  it('/api/export-templates は API パス', () => {
    expect(isApiPath('/api/export-templates')).toBe(true)
  })

  it('/ は API パスではない', () => {
    expect(isApiPath('/')).toBe(false)
  })

  it('/dashboard は API パスではない', () => {
    expect(isApiPath('/dashboard')).toBe(false)
  })

  it('/login は API パスではない', () => {
    expect(isApiPath('/login')).toBe(false)
  })
})
