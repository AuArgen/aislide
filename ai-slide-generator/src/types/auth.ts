export type UserRole = 'user' | 'teacher' | 'admin'

export interface User {
  id: string
  google_id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
  last_login: string | null
}

export interface Subscription {
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

export interface ExternalRoleCheck {
  role: string
  subscriptions?: {
    is_active: boolean
    expires_at: string
  }[]
}
