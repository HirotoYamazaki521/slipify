import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface CreateUsageLogData {
  userId: string
  model: string
  inputTokens: number
  outputTokens: number
  entityType: string
  status: 'success' | 'failure'
  errorMessage?: string
}

export interface UsageLogRepository {
  create(data: CreateUsageLogData): Promise<void>
}

export async function createUsageLogRepository(): Promise<UsageLogRepository> {
  const supabase = await createServerSupabaseClient()

  return {
    async create(data: CreateUsageLogData): Promise<void> {
      try {
        const { error } = await supabase.from('api_usage_logs').insert({
          user_id: data.userId,
          model: data.model,
          input_tokens: data.inputTokens,
          output_tokens: data.outputTokens,
          entity_type: data.entityType,
          status: data.status,
          error_message: data.errorMessage ?? null,
        })

        if (error) {
          // ログ書き込み失敗は呼び出し元に伝播しない（要件7.3）
          console.error('[UsageLogRepository] ログ書き込みに失敗しました:', error.message)
        }
      } catch (err) {
        // 予期せぬ例外も伝播しない
        console.error('[UsageLogRepository] 予期せぬエラー:', err)
      }
    },
  }
}
