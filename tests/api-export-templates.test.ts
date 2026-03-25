import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase モック
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

// ExportTemplateRepository モック
const mockFindMany = vi.fn()
const mockFindById = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
vi.mock('@/lib/repositories/export-template-repository', () => ({
  createExportTemplateRepository: vi.fn().mockResolvedValue({
    findMany: mockFindMany,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
  }),
}))

const MOCK_USER = { id: 'user-1' }

const MOCK_TEMPLATE = {
  id: 'tmpl-1',
  userId: 'user-1',
  name: 'マイテンプレート',
  columns: [
    { label: '日付', sourceField: 'receipt_date', order: 0 },
    { label: '店名', sourceField: 'store_name', order: 1 },
  ],
  delimiter: ',',
  isDefault: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

const MOCK_TEMPLATE_2 = {
  ...MOCK_TEMPLATE,
  id: 'tmpl-2',
  name: '会計ソフト用',
  isDefault: true,
}

function makeRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ────────────────────────────────────────────
// GET /api/export-templates
// ────────────────────────────────────────────
describe('GET /api/export-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindMany.mockResolvedValue([MOCK_TEMPLATE, MOCK_TEMPLATE_2])
  })

  it('200 でテンプレート一覧を返す', async () => {
    const { GET } = await import('@/app/api/export-templates/route')
    const res = await GET(makeRequest('GET', 'http://localhost/api/export-templates') as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.templates).toHaveLength(2)
    expect(body.templates[0].name).toBe('マイテンプレート')
    expect(body.templates[1].name).toBe('会計ソフト用')
  })

  it('テンプレートが空の場合 templates: [] を返す', async () => {
    mockFindMany.mockResolvedValueOnce([])
    const { GET } = await import('@/app/api/export-templates/route')
    const res = await GET(makeRequest('GET', 'http://localhost/api/export-templates') as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.templates).toHaveLength(0)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { GET } = await import('@/app/api/export-templates/route')
    const res = await GET(makeRequest('GET', 'http://localhost/api/export-templates') as never)
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// POST /api/export-templates
// ────────────────────────────────────────────
describe('POST /api/export-templates', () => {
  const validBody = {
    name: '新規テンプレート',
    columns: [{ label: '日付', sourceField: 'receipt_date', order: 0 }],
    delimiter: ',',
    isDefault: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockCreate.mockResolvedValue({ ...MOCK_TEMPLATE, name: '新規テンプレート' })
  })

  it('201 で作成されたテンプレートを返す', async () => {
    const { POST } = await import('@/app/api/export-templates/route')
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/export-templates', validBody) as never
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.template.name).toBe('新規テンプレート')
  })

  it('name が未指定の場合 400 を返す', async () => {
    const { POST } = await import('@/app/api/export-templates/route')
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/export-templates', {
        ...validBody,
        name: undefined,
      }) as never
    )
    expect(res.status).toBe(400)
  })

  it('columns が空配列の場合 400 を返す', async () => {
    const { POST } = await import('@/app/api/export-templates/route')
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/export-templates', {
        ...validBody,
        columns: [],
      }) as never
    )
    expect(res.status).toBe(400)
  })

  it('delimiter が不正な場合 400 を返す', async () => {
    const { POST } = await import('@/app/api/export-templates/route')
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/export-templates', {
        ...validBody,
        delimiter: '|',
      }) as never
    )
    expect(res.status).toBe(400)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/export-templates/route')
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/export-templates', validBody) as never
    )
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// PUT /api/export-templates/[id]
// ────────────────────────────────────────────
describe('PUT /api/export-templates/[id]', () => {
  const updateBody = { name: '更新後テンプレート', delimiter: '\t' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindById.mockResolvedValue(MOCK_TEMPLATE)
    mockUpdate.mockResolvedValue({ ...MOCK_TEMPLATE, name: '更新後テンプレート', delimiter: '\t' })
  })

  it('200 で更新後のテンプレートを返す', async () => {
    const { PUT } = await import('@/app/api/export-templates/[id]/route')
    const res = await PUT(
      makeRequest('PUT', 'http://localhost/api/export-templates/tmpl-1', updateBody) as never,
      { params: Promise.resolve({ id: 'tmpl-1' }) }
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.template.name).toBe('更新後テンプレート')
    expect(body.template.delimiter).toBe('\t')
  })

  it('存在しない id の場合 404 を返す', async () => {
    mockFindById.mockResolvedValueOnce(null)
    const { PUT } = await import('@/app/api/export-templates/[id]/route')
    const res = await PUT(
      makeRequest('PUT', 'http://localhost/api/export-templates/nonexistent', updateBody) as never,
      { params: Promise.resolve({ id: 'nonexistent' }) }
    )
    expect(res.status).toBe(404)
  })

  it('columns が空配列の場合 400 を返す', async () => {
    const { PUT } = await import('@/app/api/export-templates/[id]/route')
    const res = await PUT(
      makeRequest('PUT', 'http://localhost/api/export-templates/tmpl-1', {
        columns: [],
      }) as never,
      { params: Promise.resolve({ id: 'tmpl-1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { PUT } = await import('@/app/api/export-templates/[id]/route')
    const res = await PUT(
      makeRequest('PUT', 'http://localhost/api/export-templates/tmpl-1', updateBody) as never,
      { params: Promise.resolve({ id: 'tmpl-1' }) }
    )
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────
// DELETE /api/export-templates/[id]
// ────────────────────────────────────────────
describe('DELETE /api/export-templates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockFindById.mockResolvedValue(MOCK_TEMPLATE)
    mockDelete.mockResolvedValue(undefined)
  })

  it('204 を返す', async () => {
    const { DELETE } = await import('@/app/api/export-templates/[id]/route')
    const res = await DELETE(
      makeRequest('DELETE', 'http://localhost/api/export-templates/tmpl-1') as never,
      { params: Promise.resolve({ id: 'tmpl-1' }) }
    )
    expect(res.status).toBe(204)
  })

  it('存在しない id の場合 404 を返す', async () => {
    mockFindById.mockResolvedValueOnce(null)
    const { DELETE } = await import('@/app/api/export-templates/[id]/route')
    const res = await DELETE(
      makeRequest('DELETE', 'http://localhost/api/export-templates/nonexistent') as never,
      { params: Promise.resolve({ id: 'nonexistent' }) }
    )
    expect(res.status).toBe(404)
  })

  it('未認証の場合 401 を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const { DELETE } = await import('@/app/api/export-templates/[id]/route')
    const res = await DELETE(
      makeRequest('DELETE', 'http://localhost/api/export-templates/tmpl-1') as never,
      { params: Promise.resolve({ id: 'tmpl-1' }) }
    )
    expect(res.status).toBe(401)
  })
})
