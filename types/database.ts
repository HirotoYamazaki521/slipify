// =====================================================
// Supabase データベース型定義
// このファイルは `supabase gen types typescript --project-id <project-id>` で自動生成される
// Supabaseプロジェクト接続後に上書きすること
// =====================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      receipts: {
        Row: {
          id: string
          user_id: string
          image_path: string
          store_name: string
          receipt_date: string
          total_amount: number
          tax_amount: number
          ai_account_category: string
          account_category: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_path: string
          store_name: string
          receipt_date: string
          total_amount: number
          tax_amount?: number
          ai_account_category: string
          account_category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_path?: string
          store_name?: string
          receipt_date?: string
          total_amount?: number
          tax_amount?: number
          ai_account_category?: string
          account_category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      line_items: {
        Row: {
          id: string
          receipt_id: string
          name: string
          unit_price: number
          quantity: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          name: string
          unit_price: number
          quantity?: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          name?: string
          unit_price?: number
          quantity?: number
          subtotal?: number
          created_at?: string
        }
        Relationships: []
      }
      export_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          columns: Json
          delimiter: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          columns: Json
          delimiter?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          columns?: Json
          delimiter?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          id: string
          user_id: string
          model: string
          input_tokens: number
          output_tokens: number
          entity_type: string
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model: string
          input_tokens?: number
          output_tokens?: number
          entity_type: string
          status: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model?: string
          input_tokens?: number
          output_tokens?: number
          entity_type?: string
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      custom_account_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
