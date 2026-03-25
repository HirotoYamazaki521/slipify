import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase チェーン API モック
const mockGetUser = vi.fn()
const mockCategoryFetch = vi.fn()  // .order() の結果 (GET)
const mockCategoryInsert = vi.fn() // .single() の結果 (POST)

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockReturnValue({
      // GET: .select().eq().order()
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockImplementation(() => mockCategoryFetch()),
        }),
      }),
      // POST: .insert().select().single()
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => mockCategoryInsert()),
        }),
      }),
    }),
  }),
}))

const MOCK_USER = { id: 'user-1' }

const MOCK_CUSTOM_CATEGORIES = [
  { id: 'cat-1', user_id: 'user-1', name: '研究費', created_at: '2024-01-15T10:00:00Z' },
]

const MOCK_NEW_CATEGORY = {
  id: 'cat-2',
  user_id: 'user-1',
  name: '研究費2',
  created_at: '2024-01-16T10:00:00Z',
}

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/account-categories', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ────────────────────────────────────────────
// GET /api/account-categories
// ────────────────────────────────────────────
describe('GET /api/account-categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockCategoryFetch.mockResolvedValue({ data: MOCK_CUSTOM_CATEGORIES, error: null })
  })

  it('200 で固定科目リストとカスタム科目一覧を返す', async () => {
    const { GET } = await import('@/app/api/account-categories/route')
    const res = await GET(makeRequest('GET') as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.fixed).toHaveLength(12) // ACCOUNT_CATEGORY_LIST は12件
    expect(body.fixed).toContain('消耗品費')
    expect(body.custom).toHaveLength(1)
    expect(body.custom[0].name).toBe('研究費')
    expect(body.custom[0].userId).toBe('user-1') // camelCase 変換
  })

  it('カスタム科目が空の場合 custom: [] を返す', async () => {
    mockCategoryFetch.mockResolvedValueOnce({ data: [], error: null })
    const { GET } = await import('@/app/api/account-categories/route')
    const res = await GET(makeRequest('GET') as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.custom).toHaveLength(0)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { GET } = await import('@/app/api/account-categories/route')
    const res = await GET(makeRequest('GET') as never)
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// POST /api/account-categories
// ────────────────────────────────────────────
describe('POST /api/account-categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockCategoryInsert.mockResolvedValue({ data: MOCK_NEW_CATEGORY, error: null })
  })

  it('201 で作成されたカスタム科目を返す', async () => {
    const { POST } = await import('@/app/api/account-categories/route')
    const res = await POST(makeRequest('POST', { name: '研究費2' }) as never)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.category.name).toBe('研究費2')
    expect(body.category.userId).toBe('user-1')
  })

  it('name が未指定の場合 400 を返す', async () => {
    const { POST } = await import('@/app/api/account-categories/route')
    const res = await POST(makeRequest('POST', {}) as never)
    expect(res.status).toBe(400)
  })

  it('name が空文字の場合 400 を返す', async () => {
    const { POST } = await import('@/app/api/account-categories/route')
    const res = await POST(makeRequest('POST', { name: '' }) as never)
    expect(res.status).toBe(400)
  })

  it('重複名の場合 409 を返す', async () => {
    mockCategoryInsert.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value' },
    })
    const { POST } = await import('@/app/api/account-categories/route')
    const res = await POST(makeRequest('POST', { name: '研究費' }) as never)
    expect(res.status).toBe(409)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/account-categories/route')
    const res = await POST(makeRequest('POST', { name: '研究費2' }) as never)
    expect(res.status).toBe(401)
  })
})
