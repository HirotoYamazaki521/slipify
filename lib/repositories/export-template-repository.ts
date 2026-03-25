import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ExportTemplate, ExportColumn, Delimiter } from '@/types/domain'

export interface ExportTemplateRow {
  id: string
  user_id: string
  name: string
  columns: unknown
  delimiter: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export function mapExportTemplateRow(row: ExportTemplateRow): ExportTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    columns: (row.columns as ExportColumn[]) ?? [],
    delimiter: row.delimiter as Delimiter,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface CreateTemplateData {
  userId: string
  name: string
  columns: ExportColumn[]
  delimiter: Delimiter
  isDefault?: boolean
}

export interface UpdateTemplateData {
  name?: string
  columns?: ExportColumn[]
  delimiter?: Delimiter
  isDefault?: boolean
}

export interface ExportTemplateRepository {
  findMany(userId: string): Promise<ExportTemplate[]>
  findById(id: string, userId: string): Promise<ExportTemplate | null>
  findDefault(userId: string): Promise<ExportTemplate | null>
  create(data: CreateTemplateData): Promise<ExportTemplate>
  update(id: string, userId: string, data: UpdateTemplateData): Promise<ExportTemplate>
  delete(id: string, userId: string): Promise<void>
}

export async function createExportTemplateRepository(): Promise<ExportTemplateRepository> {
  const supabase = await createServerSupabaseClient()

  return {
    async findMany(userId: string): Promise<ExportTemplate[]> {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`findMany templates failed: ${error.message}`)
      return (data ?? []).map(mapExportTemplateRow)
    },

    async findById(id: string, userId: string): Promise<ExportTemplate | null> {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`findById template failed: ${error.message}`)
      }
      return data ? mapExportTemplateRow(data) : null
    },

    async findDefault(userId: string): Promise<ExportTemplate | null> {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .limit(1)

      if (error) throw new Error(`findDefault template failed: ${error.message}`)
      const rows = data ?? []
      return rows.length > 0 ? mapExportTemplateRow(rows[0]) : null
    },

    async create(data: CreateTemplateData): Promise<ExportTemplate> {
      const { data: row, error } = await supabase
        .from('export_templates')
        .insert({
          user_id: data.userId,
          name: data.name,
          columns: data.columns,
          delimiter: data.delimiter,
          is_default: data.isDefault ?? false,
        })
        .select()
        .single()

      if (error) throw new Error(`create template failed: ${error.message}`)
      if (!row) throw new Error('create template returned no data')
      return mapExportTemplateRow(row)
    },

    async update(
      id: string,
      userId: string,
      data: UpdateTemplateData
    ): Promise<ExportTemplate> {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) updatePayload.name = data.name
      if (data.columns !== undefined) updatePayload.columns = data.columns
      if (data.delimiter !== undefined) updatePayload.delimiter = data.delimiter
      if (data.isDefault !== undefined) updatePayload.is_default = data.isDefault

      const { data: row, error } = await supabase
        .from('export_templates')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw new Error(`update template failed: ${error.message}`)
      if (!row) throw new Error('update template returned no data')
      return mapExportTemplateRow(row)
    },

    async delete(id: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('export_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(`delete template failed: ${error.message}`)
    },
  }
}
