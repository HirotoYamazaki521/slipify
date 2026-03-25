import Anthropic, { APIError } from '@anthropic-ai/sdk'
import { createUsageLogRepository } from '@/lib/repositories/usage-log-repository'
import type { Result } from '@/types/domain'

const DEFAULT_TIMEOUT_MS = 25_000

export interface AnthropicCallParams {
  model: string
  messages: Anthropic.Messages.MessageParam[]
  tools: Anthropic.Messages.Tool[]
  maxTokens: number
}

export type AnthropicError =
  | { code: 'TIMEOUT'; message: string }
  | { code: 'API_ERROR'; message: string; statusCode?: number }

export interface AnthropicWrapper {
  callWithTracking(
    params: AnthropicCallParams,
    userId: string
  ): Promise<Result<Anthropic.Messages.ToolUseBlock, AnthropicError>>
}

export function createAnthropicWrapper(timeoutMs: number = DEFAULT_TIMEOUT_MS): AnthropicWrapper {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  return {
    async callWithTracking(
      params: AnthropicCallParams,
      userId: string
    ): Promise<Result<Anthropic.Messages.ToolUseBlock, AnthropicError>> {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      )

      let inputTokens = 0
      let outputTokens = 0

      try {
        const response = (await Promise.race([
          client.messages.create({
            model: params.model,
            max_tokens: params.maxTokens,
            messages: params.messages,
            tools: params.tools,
          }),
          timeoutPromise,
        ])) as Anthropic.Messages.Message

        inputTokens = response.usage.input_tokens
        outputTokens = response.usage.output_tokens

        const toolUseBlock = response.content.find(
          (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
        )

        if (!toolUseBlock) {
          const error: AnthropicError = {
            code: 'API_ERROR',
            message: 'レスポンスに tool_use ブロックが含まれていません',
          }
          await logUsage(userId, params.model, inputTokens, outputTokens, 'failure', error.message)
          return { ok: false, error }
        }

        await logUsage(userId, params.model, inputTokens, outputTokens, 'success')
        return { ok: true, data: toolUseBlock }
      } catch (err) {
        if (err instanceof Error && err.message === 'timeout') {
          const error: AnthropicError = {
            code: 'TIMEOUT',
            message: 'Claude API の呼び出しがタイムアウトしました (timeout)',
          }
          await logUsage(userId, params.model, inputTokens, outputTokens, 'failure', error.message)
          return { ok: false, error }
        }

        if (err instanceof APIError) {
          const error: AnthropicError = {
            code: 'API_ERROR',
            message: err.message,
            statusCode: err.status,
          }
          await logUsage(userId, params.model, inputTokens, outputTokens, 'failure', err.message)
          return { ok: false, error }
        }

        const error: AnthropicError = {
          code: 'API_ERROR',
          message: err instanceof Error ? err.message : '予期せぬエラー',
        }
        await logUsage(userId, params.model, inputTokens, outputTokens, 'failure', error.message)
        return { ok: false, error }
      }
    },
  }
}

async function logUsage(
  userId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  status: 'success' | 'failure',
  errorMessage?: string
): Promise<void> {
  try {
    const repo = await createUsageLogRepository()
    await repo.create({
      userId,
      model,
      inputTokens,
      outputTokens,
      entityType: 'receipt',
      status,
      errorMessage,
    })
  } catch (err) {
    // ログ書き込み失敗は呼び出し元に伝播しない（要件7.3）
    console.error('[AnthropicWrapper] 使用量ログ書き込みに失敗しました:', err)
  }
}
