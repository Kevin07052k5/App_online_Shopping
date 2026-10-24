export interface AuthUser {
  id: string
  name: string
  email: string
  phoneNumber?: string
  role: 'USER' | 'ADMIN'
  provider: 'GOOGLE' | 'APPLE' | 'FACEBOOK' | 'TWITTER' | 'CREDENTIALS'
  avatar?: string
  createdAt: string
}

export interface RegisterFormData {
  name: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

export interface LoginFormData {
  emailOrUsername: string
  password: string
}
