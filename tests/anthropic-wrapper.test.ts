import { describe, it, expect, vi, beforeEach } from 'vitest'

// Anthropic SDK モック
const mockMessagesCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
  APIError: class APIError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

// UsageLogRepository モック
const mockUsageLogCreate = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/repositories/usage-log-repository', () => ({
  createUsageLogRepository: vi.fn().mockResolvedValue({
    create: mockUsageLogCreate,
  }),
}))

const DUMMY_PARAMS = {
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user' as const, content: 'test' }],
  tools: [{ name: 'test_tool', description: 'test', input_schema: { type: 'object' as const, properties: {} } }],
  maxTokens: 1024,
}

describe('AnthropicWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsageLogCreate.mockResolvedValue(undefined)
    // 環境変数を設定
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  describe('callWithTracking: 成功ケース', () => {
    it('ToolUseBlock を ok: true で返す', async () => {
      const toolUseBlock = {
        type: 'tool_use',
        id: 'tool-1',
        name: 'extract_receipt',
        input: { store_name: 'セブン' },
      }
      mockMessagesCreate.mockResolvedValueOnce({
        content: [toolUseBlock],
        usage: { input_tokens: 100, output_tokens: 50 },
        model: 'claude-sonnet-4-6',
      })

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper()
      const result = await wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.type).toBe('tool_use')
        expect(result.data.name).toBe('extract_receipt')
      }
    })

    it('成功時に使用量ログを記録する', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'tool_use', id: 'tool-1', name: 'extract_receipt', input: {} }],
        usage: { input_tokens: 100, output_tokens: 50 },
        model: 'claude-sonnet-4-6',
      })

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper()
      await wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')

      expect(mockUsageLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          model: 'claude-sonnet-4-6',
          inputTokens: 100,
          outputTokens: 50,
          status: 'success',
        })
      )
    })
  })

  describe('callWithTracking: タイムアウト', () => {
    it('25秒超過時に TIMEOUT エラーを返す', async () => {
      // タイムアウトのシミュレーション
      mockMessagesCreate.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 30000))
      )

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper(100) // 100ms タイムアウトでテスト
      const result = await wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT')
      }
    })

    it('タイムアウト時も失敗ログを記録する', async () => {
      mockMessagesCreate.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 30000))
      )

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper(100)
      await wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')

      expect(mockUsageLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failure',
          errorMessage: expect.stringContaining('timeout'),
        })
      )
    })
  })

  describe('callWithTracking: API エラー', () => {
    it('API エラー時に API_ERROR を返す', async () => {
      // モックの APIError クラスを直接使用
      const { APIError } = (await import('@anthropic-ai/sdk')) as unknown as { APIError: new (msg: string, status: number) => Error & { status: number } }
      mockMessagesCreate.mockRejectedValueOnce(new APIError('Rate limit exceeded', 429))

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper()
      const result = await wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('API_ERROR')
        if (result.error.code === 'API_ERROR') {
          expect(result.error.statusCode).toBe(429)
        }
      }
    })

    it('API エラー時も失敗ログを記録する', async () => {
      const { APIError } = (await import('@anthropic-ai/sdk')) as unknown as { APIError: new (msg: string, status: number) => Error & { status: number } }
      mockMessagesCreate.mockRejectedValueOnce(new APIError('Server error', 500))

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper()
      await wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')

      expect(mockUsageLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failure' })
      )
    })
  })

  describe('ログ書き込み失敗の非伝播', () => {
    it('ログ書き込みが失敗しても結果は正常に返される', async () => {
      mockUsageLogCreate.mockRejectedValueOnce(new Error('DB connection failed'))
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'tool_use', id: 'tool-1', name: 'extract_receipt', input: {} }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-sonnet-4-6',
      })

      const { createAnthropicWrapper } = await import('@/lib/anthropic/anthropic-wrapper')
      const wrapper = createAnthropicWrapper()

      // ログ書き込み失敗でも例外がスローされないこと
      await expect(wrapper.callWithTracking(DUMMY_PARAMS, 'user-1')).resolves.toMatchObject({
        ok: true,
      })
    })
  })
})
