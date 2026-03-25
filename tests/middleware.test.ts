import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// @supabase/ssr のモック
const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: { getUser: mockGetUser },
  }),
}))

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('公開パス（/login, /signup）', () => {
    it('/login は未認証でもリダイレクトしない', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const { middleware } = await import('@/middleware')
      const req = new NextRequest('http://localhost/login')
      const res = await middleware(req)
      expect(res.headers.get('Location')).toBeNull()
    })

    it('/signup は未認証でもリダイレクトしない', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const { middleware } = await import('@/middleware')
      const req = new NextRequest('http://localhost/signup')
      const res = await middleware(req)
      expect(res.headers.get('Location')).toBeNull()
    })
  })

  describe('未認証アクセス', () => {
    it('ページアクセスは /login へリダイレクトする', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const { middleware } = await import('@/middleware')
      const req = new NextRequest('http://localhost/receipts')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('Location')).toContain('/login')
    })

    it('API パスへの未認証アクセスは 401 を返す', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const { middleware } = await import('@/middleware')
      const req = new NextRequest('http://localhost/api/receipts')
      const res = await middleware(req)
      expect(res.status).toBe(401)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('認証済みアクセス', () => {
    it('認証済みのページアクセスは通過する（リダイレクトなし）', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const { middleware } = await import('@/middleware')
      const req = new NextRequest('http://localhost/receipts')
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
      expect(res.headers.get('Location')).toBeNull()
    })

    it('認証済みの API アクセスは通過する', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const { middleware } = await import('@/middleware')
      const req = new NextRequest('http://localhost/api/receipts')
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })
  })
})
