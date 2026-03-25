import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}))

describe('UsageLogRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ insert: mockInsert })
    mockInsert.mockResolvedValue({ data: null, error: null })
  })

  it('成功ログを api_usage_logs に挿入する', async () => {
    const { createUsageLogRepository } = await import(
      '@/lib/repositories/usage-log-repository'
    )
    const repo = await createUsageLogRepository()

    await repo.create({
      userId: 'user-1',
      model: 'claude-sonnet-4-6',
      inputTokens: 100,
      outputTokens: 50,
      entityType: 'receipt',
      status: 'success',
    })

    expect(mockFrom).toHaveBeenCalledWith('api_usage_logs')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        model: 'claude-sonnet-4-6',
        input_tokens: 100,
        output_tokens: 50,
        entity_type: 'receipt',
        status: 'success',
        error_message: null,
      })
    )
  })

  it('失敗ログも挿入できる', async () => {
    const { createUsageLogRepository } = await import(
      '@/lib/repositories/usage-log-repository'
    )
    const repo = await createUsageLogRepository()

    await repo.create({
      userId: 'user-1',
      model: 'claude-sonnet-4-6',
      inputTokens: 0,
      outputTokens: 0,
      entityType: 'receipt',
      status: 'failure',
      errorMessage: 'API timeout',
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failure',
        error_message: 'API timeout',
      })
    )
  })

  it('INSERT エラーが発生しても例外を伝播しない', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const { createUsageLogRepository } = await import(
      '@/lib/repositories/usage-log-repository'
    )
    const repo = await createUsageLogRepository()

    // 例外がスローされないこと
    await expect(
      repo.create({
        userId: 'user-1',
        model: 'claude-sonnet-4-6',
        inputTokens: 0,
        outputTokens: 0,
        entityType: 'receipt',
        status: 'failure',
      })
    ).resolves.toBeUndefined()
  })
})
