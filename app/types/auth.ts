import type { TermConsentRequest } from './terms'

export interface LoginRequest {
  email: string
  password: string
  login_type: 'password'
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  userType: 'ADMIN' | 'MANAGER' | 'SUPPORT'
  termConsent: TermConsentRequest
}

export interface User {
  id: number
  name: string
  email: string
  userType: 1 | 2 | 3 | 'ADMIN' | 'MANAGER' | 'SUPPORT' // 1 = ADMIN, 2 = MANAGER, 3 = SUPPORT
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface RegisterSuccessResponse {
  success: true
  timestamp: string
  data: User
  message: string
}

export interface LoginSuccessResponse {
  success: true
  timestamp: string
  data: {
    token: string
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
}
