import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase モック
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

// ReceiptRepository モック
const mockFindMany = vi.fn()
const mockFindByIdWithLineItems = vi.fn()
const mockUpdateAccountCategory = vi.fn()
const mockDelete = vi.fn()
vi.mock('@/lib/repositories/receipt-repository', () => ({
  createReceiptRepository: vi.fn().mockResolvedValue({
    findMany: mockFindMany,
    findByIdWithLineItems: mockFindByIdWithLineItems,
    updateAccountCategory: mockUpdateAccountCategory,
    delete: mockDelete,
  }),
}))

const MOCK_USER = { id: 'user-1' }

const MOCK_RECEIPTS = [
  {
    id: 'r1',
    userId: 'user-1',
    imagePath: 'receipts/user-1/r1.jpg',
    storeName: 'セブン',
    receiptDate: '2024-01-15',
    totalAmount: 1000,
    taxAmount: 100,
    aiAccountCategory: '消耗品費',
    accountCategory: null,
    status: 'processed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'r2',
    userId: 'user-1',
    imagePath: 'receipts/user-1/r2.jpg',
    storeName: 'ローソン',
    receiptDate: '2024-01-16',
    totalAmount: 500,
    taxAmount: 50,
    aiAccountCategory: '交際費',
    accountCategory: '交際費',
    status: 'processed',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
]

const MOCK_RECEIPT_WITH_ITEMS = {
  ...MOCK_RECEIPTS[0],
  lineItems: [
    { id: 'li1', receiptId: 'r1', name: 'コーヒー', unitPrice: 150, quantity: 1, subtotal: 150 },
  ],
}

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init)
}

// ────────────────────────────────────────────
// GET /api/receipts
// ────────────────────────────────────────────
describe('GET /api/receipts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindMany.mockResolvedValue(MOCK_RECEIPTS)
  })

  it('200 でレシート一覧・total・totalAmount を返す', async () => {
    const { GET } = await import('@/app/api/receipts/route')
    const res = await GET(makeRequest('http://localhost/api/receipts') as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.receipts).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.totalAmount).toBe(1500)
  })

  it('receipts が空の場合 total=0, totalAmount=0 を返す', async () => {
    mockFindMany.mockResolvedValueOnce([])
    const { GET } = await import('@/app/api/receipts/route')
    const res = await GET(makeRequest('http://localhost/api/receipts') as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.receipts).toHaveLength(0)
    expect(body.total).toBe(0)
    expect(body.totalAmount).toBe(0)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { GET } = await import('@/app/api/receipts/route')
    const res = await GET(makeRequest('http://localhost/api/receipts') as never)
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// GET /api/receipts/[id]
// ────────────────────────────────────────────
describe('GET /api/receipts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindByIdWithLineItems.mockResolvedValue(MOCK_RECEIPT_WITH_ITEMS)
  })

  it('200 でレシートと品目を返す', async () => {
    const { GET } = await import('@/app/api/receipts/[id]/route')
    const res = await GET(makeRequest('http://localhost/api/receipts/r1') as never, {
      params: Promise.resolve({ id: 'r1' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.receipt.id).toBe('r1')
    expect(body.receipt.lineItems).toHaveLength(1)
  })

  it('存在しない ID の場合 404 を返す', async () => {
    mockFindByIdWithLineItems.mockResolvedValueOnce(null)
    const { GET } = await import('@/app/api/receipts/[id]/route')
    const res = await GET(makeRequest('http://localhost/api/receipts/unknown') as never, {
      params: Promise.resolve({ id: 'unknown' }),
    })
    expect(res.status).toBe(404)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { GET } = await import('@/app/api/receipts/[id]/route')
    const res = await GET(makeRequest('http://localhost/api/receipts/r1') as never, {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// DELETE /api/receipts/[id]
// ────────────────────────────────────────────
describe('DELETE /api/receipts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindByIdWithLineItems.mockResolvedValue(MOCK_RECEIPT_WITH_ITEMS)
    mockDelete.mockResolvedValue(undefined)
  })

  it('正常削除で 204 を返す', async () => {
    const { DELETE } = await import('@/app/api/receipts/[id]/route')
    const res = await DELETE(makeRequest('http://localhost/api/receipts/r1') as never, {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledWith('r1', 'user-1')
  })

  it('存在しない ID の場合 404 を返す', async () => {
    mockFindByIdWithLineItems.mockResolvedValueOnce(null)
    const { DELETE } = await import('@/app/api/receipts/[id]/route')
    const res = await DELETE(makeRequest('http://localhost/api/receipts/unknown') as never, {
      params: Promise.resolve({ id: 'unknown' }),
    })
    expect(res.status).toBe(404)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { DELETE } = await import('@/app/api/receipts/[id]/route')
    const res = await DELETE(makeRequest('http://localhost/api/receipts/r1') as never, {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// PATCH /api/receipts/[id]
// ────────────────────────────────────────────
describe('PATCH /api/receipts/[id]', () => {
  const UPDATED_RECEIPT = { ...MOCK_RECEIPTS[0], accountCategory: '交通費' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindByIdWithLineItems.mockResolvedValue(MOCK_RECEIPT_WITH_ITEMS)
    mockUpdateAccountCategory.mockResolvedValue(UPDATED_RECEIPT)
  })

  function makePatchRequest(body: unknown): Request {
    return new Request('http://localhost/api/receipts/r1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('200 で更新後のレシートを返す', async () => {
    const { PATCH } = await import('@/app/api/receipts/[id]/route')
    const res = await PATCH(makePatchRequest({ accountCategory: '交通費' }) as never, {
      params: Promise.resolve({ id: 'r1' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.receipt.accountCategory).toBe('交通費')
    expect(mockUpdateAccountCategory).toHaveBeenCalledWith('r1', 'user-1', '交通費')
  })

  it('accountCategory が未指定の場合 400 を返す', async () => {
    const { PATCH } = await import('@/app/api/receipts/[id]/route')
    const res = await PATCH(makePatchRequest({}) as never, {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(400)
  })

  it('accountCategory が空文字の場合 400 を返す', async () => {
    const { PATCH } = await import('@/app/api/receipts/[id]/route')
    const res = await PATCH(makePatchRequest({ accountCategory: '' }) as never, {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(400)
  })

  it('存在しない ID の場合 404 を返す', async () => {
    mockFindByIdWithLineItems.mockResolvedValueOnce(null)
    const { PATCH } = await import('@/app/api/receipts/[id]/route')
    const res = await PATCH(makePatchRequest({ accountCategory: '交通費' }) as never, {
      params: Promise.resolve({ id: 'unknown' }),
    })
    expect(res.status).toBe(404)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { PATCH } = await import('@/app/api/receipts/[id]/route')
    const res = await PATCH(makePatchRequest({ accountCategory: '交通費' }) as never, {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(401)
  })
})
