export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          google_id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: 'user' | 'teacher' | 'admin'
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          google_id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: 'user' | 'teacher' | 'admin'
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          google_id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'user' | 'teacher' | 'admin'
          created_at?: string
          last_login?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'premium'
          status: 'active' | 'pending' | 'expired' | 'rejected'
          start_date: string | null
          end_date: string | null
          payment_proof_url: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type?: 'free' | 'premium'
          status?: 'active' | 'pending' | 'expired' | 'rejected'
          start_date?: string | null
          end_date?: string | null
          payment_proof_url?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'free' | 'premium'
          status?: 'active' | 'pending' | 'expired' | 'rejected'
          start_date?: string | null
          end_date?: string | null
          payment_proof_url?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      presentations: {
        Row: {
          id: string
          user_id: string
          title: string
          theme: string | null
          slides: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          theme?: string | null
          slides?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          theme?: string | null
          slides?: Json
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: 'info' | 'success' | 'error' | 'payment'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type?: 'info' | 'success' | 'error' | 'payment'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: 'info' | 'success' | 'error' | 'payment'
          is_read?: boolean
          created_at?: string
        }
      }
      ai_logs: {
        Row: {
          id: string
          user_id: string
          presentation_id: string | null
          prompt: string
          client_prompt: string | null
          full_prompt: string | null
          response: string
          is_valid: boolean
          tokens_used: number
          cost_usd: number
          duration_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          presentation_id?: string | null
          prompt: string
          client_prompt?: string | null
          full_prompt?: string | null
          response?: string | null
          is_valid?: boolean
          tokens_used?: number
          cost_usd?: number
          duration_ms?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          presentation_id?: string | null
          prompt?: string
          client_prompt?: string | null
          full_prompt?: string | null
          response?: string
          is_valid?: boolean
          tokens_used?: number
          cost_usd?: number
          duration_ms?: number
          created_at?: string
        }
      }
    }
  }
}
