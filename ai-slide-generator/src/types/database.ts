export type UserRole = 'user' | 'teacher' | 'admin'
export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'rejected'
export type NotificationType = 'info' | 'success' | 'error' | 'payment'

export interface DbUser {
  id: string
  google_id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
  last_login: string | null
}

export interface DbPresentation {
  id: string
  user_id: string
  title: string
  theme: string | null
  slides: string // JSON string
  created_at: string
  updated_at: string
}

export interface DbSubscription {
  id: string
  user_id: string
  plan_type: 'free' | 'premium'
  status: SubscriptionStatus
  start_date: string | null
  end_date: string | null
  payment_proof_url: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface DbSetting {
  key: string
  value: string
  created_at: string
  updated_at: string
}

export interface DbNotification {
  id: string
  user_id: string
  message: string
  type: NotificationType
  is_read: 0 | 1
  created_at: string
}

export interface DbAiLog {
  id: string
  user_id: string
  presentation_id: string | null
  prompt: string
  client_prompt: string | null
  full_prompt: string | null
  response: string | null
  is_valid: 0 | 1
  tokens_used: number
  cost_usd: number
  duration_ms: number
  created_at: string
}
