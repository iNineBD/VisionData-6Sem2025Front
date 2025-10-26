export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: number
  name: string
  email: string
  userType: 'AGENT' | 'ADMIN' | 'USER'
  microsoftId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string
}

export interface LoginSuccessResponse {
  success: true
  timestamp: string
  data: {
    token: string
    token_type: string
    expires_in: number
    expires_at: string
    user: User
  }
  message: string
}

export interface LoginErrorResponse {
  success: false
  timestamp: string
  error: string
  code: number
  message: string
}

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse

export interface UserSession {
  user: User
  token: string
  tokenType: string
  expiresAt: string
}
