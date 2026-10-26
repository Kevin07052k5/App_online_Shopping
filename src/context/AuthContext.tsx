'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthUser, RegisterFormData } from '../types/auth'
import { createClient } from '@/utils/supabase/client'

interface AuthContextType {
  currentUser: AuthUser | null
  isAdminAuthenticated: boolean
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
  authModalMode: 'LOGIN' | 'REGISTER'
  setAuthModalMode: (mode: 'LOGIN' | 'REGISTER') => void
  loginWithGoogle: (customAccount?: { name: string; email: string; avatar?: string; phoneNumber?: string }) => Promise<void>
  loginWithApple: (customAccount?: { name: string; email: string; avatar?: string; phoneNumber?: string }) => Promise<void>
  loginWithFacebook: (customAccount?: { name: string; email: string; avatar?: string; phoneNumber?: string }) => Promise<void>
  loginWithTwitter: (customAccount?: { name: string; email: string; avatar?: string; phoneNumber?: string }) => Promise<void>
  registerWithCredentials: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>
  loginWithCredentials: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>
  loginAdmin: (username: string, pass: string) => { success: boolean; error?: string }
  isProfileModalOpen: boolean
  setIsProfileModalOpen: (open: boolean) => void
  updateProfile: (updatedData: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  logoutAdmin: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false)

  // Load auth state from localStorage on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('GROUP9_CURRENT_USER')
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser))
        } catch (e) {
          console.error('Failed to parse saved user:', e)
        }
      }

      const savedAdminAuth = localStorage.getItem('GROUP9_ADMIN_AUTH')
      if (savedAdminAuth === 'true') {
        setIsAdminAuthenticated(true)
      }
    }
  }, [])

  // Sync to localStorage
  const saveUserToStorage = (user: AuthUser | null) => {
    setCurrentUser(user)
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('GROUP9_CURRENT_USER', JSON.stringify(user))
      } else {
        localStorage.removeItem('GROUP9_CURRENT_USER')
      }
    }
  }

  const saveAdminAuthToStorage = (isAuth: boolean) => {
    setIsAdminAuthenticated(isAuth)
    if (typeof window !== 'undefined') {
      if (isAuth) {
        localStorage.setItem('GROUP9_ADMIN_AUTH', 'true')
      } else {
        localStorage.removeItem('GROUP9_ADMIN_AUTH')
      }
    }
  }

  // 1. Login with Google (OAuth 2.0 / Google Identity)
  const loginWithGoogle = async (customAccount?: {
    name: string
    email: string
    avatar?: string
    phoneNumber?: string
  }) => {
    const googleUser: AuthUser = {
      id: `usr-gg-${Date.now()}`,
      name: customAccount?.name || 'Khương Gia Phát',
      email: customAccount?.email || 'khuonggiaphat7up@gmail.com',
      phoneNumber: customAccount?.phoneNumber || '0908123456',
      role: 'USER',
      provider: 'GOOGLE',
      avatar:
        customAccount?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
    }
    saveUserToStorage(googleUser)
    setIsAuthModalOpen(false)
  }

  // 2. Login with Apple (Sign in with Apple)
  const loginWithApple = async (customAccount?: {
    name: string
    email: string
    avatar?: string
    phoneNumber?: string
  }) => {
    const appleUser: AuthUser = {
      id: `usr-apple-${Date.now()}`,
      name: customAccount?.name || 'Khương Gia Phát',
      email: customAccount?.email || 'khuonggiaphat7up@icloud.com',
      phoneNumber: customAccount?.phoneNumber || '0977665544',
      role: 'USER',
      provider: 'APPLE',
      avatar:
        customAccount?.avatar ||
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
    }
    saveUserToStorage(appleUser)
    setIsAuthModalOpen(false)
  }

  // 3. Login with Facebook
  const loginWithFacebook = async (customAccount?: {
    name: string
    email: string
    avatar?: string
    phoneNumber?: string
  }) => {
    const fbUser: AuthUser = {
      id: `usr-fb-${Date.now()}`,
      name: customAccount?.name || 'Khương Gia Phát',
      email: customAccount?.email || 'khuonggiaphat7up@gmail.com',
      phoneNumber: customAccount?.phoneNumber || '0988112233',
      role: 'USER',
      provider: 'FACEBOOK',
      avatar:
        customAccount?.avatar ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
    }
    saveUserToStorage(fbUser)
    setIsAuthModalOpen(false)
  }

  // 4. Login with Twitter (X)
  const loginWithTwitter = async (customAccount?: {
    name: string
    email: string
    avatar?: string
    phoneNumber?: string
  }) => {
    const twitterUser: AuthUser = {
      id: `usr-x-${Date.now()}`,
      name: customAccount?.name || 'Khương Gia Phát',
      email: customAccount?.email || 'khuonggiaphat7up@x.com',
      phoneNumber: customAccount?.phoneNumber || '0919887766',
      role: 'USER',
      provider: 'TWITTER',
      avatar:
        customAccount?.avatar ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
    }
    saveUserToStorage(twitterUser)
    setIsAuthModalOpen(false)
  }

  // 5. Register with Credentials (Connecting to Supabase Auth & public.profiles)
  const registerWithCredentials = async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    if (!data.name.trim()) return { success: false, error: 'Vui lòng nhập họ và tên' }
    if (!data.email.trim() || !data.email.includes('@')) return { success: false, error: 'Email không hợp lệ' }
    if (!data.phoneNumber.trim() || data.phoneNumber.length < 10) return { success: false, error: 'Số điện thoại phải từ 10 số trở lên' }
    if (!data.password || data.password.length < 6) return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' }
    if (data.password !== data.confirmPassword) return { success: false, error: 'Mật khẩu xác nhận không khớp' }
    if (!data.agreeTerms) return { success: false, error: 'Vui lòng đồng ý với điều khoản bảo mật dữ liệu PII' }

    const cleanEmail = data.email.trim().toLowerCase()
    const cleanName = data.name.trim()
    const cleanPhone = data.phoneNumber.trim()
    const defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'

    try {
      const supabase = createClient()

      // 1. Gửi lệnh đăng ký tới Supabase Auth (tạo user trong auth.users)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            name: cleanName,
            full_name: cleanName,
            phone_number: cleanPhone,
            avatar_url: defaultAvatar,
            role: 'USER',
          },
        },
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      const userId = authData.user?.id || `usr-${Date.now()}`

      // 2. Tự động upsert vào bảng public.profiles để đảm bảo hiển thị ngay trên Table Editor
      if (authData.user) {
        try {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: cleanEmail,
            name: cleanName,
            phone_number: cleanPhone,
            role: 'USER',
            provider: 'CREDENTIALS',
            avatar_url: defaultAvatar,
          })
        } catch (profileErr) {
          console.warn('Lưu vào profiles bảng phụ:', profileErr)
        }
      }

      const newUser: AuthUser = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        role: 'USER',
        provider: 'CREDENTIALS',
        avatar: defaultAvatar,
        createdAt: new Date().toISOString(),
      }

      saveUserToStorage(newUser)
      setIsAuthModalOpen(false)
      return { success: true }
    } catch (err: any) {
      console.error('Lỗi kết nối Supabase lúc đăng ký:', err)
      return { success: false, error: err.message || 'Lỗi kết nối Supabase' }
    }
  }

  // 4. Login with Credentials
  const loginWithCredentials = async (
    emailOrUsername: string,
    pass: string
  ): Promise<{ success: boolean; isAdmin?: boolean; error?: string }> => {
    const cleanUser = emailOrUsername.trim().toLowerCase()
    const cleanPass = pass.trim()

    // Check if logging in as Admin
    if (cleanUser === 'admin' && cleanPass === 'admin') {
      saveAdminAuthToStorage(true)
      const adminUser: AuthUser = {
        id: 'usr-admin-master',
        name: 'Quản Trị Viên An Ninh (Group 9)',
        email: 'admin@group9-security.internal',
        phoneNumber: '0999999999',
        role: 'ADMIN',
        provider: 'CREDENTIALS',
        avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      }
      saveUserToStorage(adminUser)
      setIsAuthModalOpen(false)
      return { success: true, isAdmin: true }
    }

    if (!cleanUser) return { success: false, error: 'Vui lòng nhập email hoặc tên đăng nhập' }
    if (!cleanPass) return { success: false, error: 'Vui lòng nhập mật khẩu' }

    // Thử xác thực với Supabase nếu người dùng nhập định dạng email
    try {
      const supabase = createClient()
      if (cleanUser.includes('@')) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanUser,
          password: cleanPass,
        })

        if (!authError && authData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle()

          const loggedUser: AuthUser = {
            id: authData.user.id,
            name: profile?.name || authData.user.user_metadata?.name || cleanUser.split('@')[0],
            email: authData.user.email || cleanUser,
            phoneNumber: profile?.phone_number || authData.user.user_metadata?.phone_number || '',
            role: (profile?.role as any) || 'USER',
            provider: 'CREDENTIALS',
            avatar:
              profile?.avatar_url ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
            createdAt: authData.user.created_at || new Date().toISOString(),
          }

          saveUserToStorage(loggedUser)
          setIsAuthModalOpen(false)
          return { success: true, isAdmin: loggedUser.role === 'ADMIN' }
        }

        if (authError) {
          return { success: false, error: authError.message }
        }
      }
    } catch (err: any) {
      console.warn('Lỗi Supabase signIn:', err)
    }

    // Mock fallback login nếu là tài khoản demo hoặc offline
    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      name: cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser,
      email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@example.com`,
      phoneNumber: '0908123456',
      role: 'USER',
      provider: 'CREDENTIALS',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
    }

    saveUserToStorage(user)
    setIsAuthModalOpen(false)
    return { success: true, isAdmin: false }
  }

  // 5. Admin portal direct login (username: admin, password: admin)
  const loginAdmin = (username: string, pass: string): { success: boolean; error?: string } => {
    if (username.trim() === 'admin' && pass.trim() === 'admin') {
      saveAdminAuthToStorage(true)
      return { success: true }
    }
    return {
      success: false,
      error: 'Tên đăng nhập hoặc mật khẩu quản trị không chính xác! (Gợi ý: admin / admin)',
    }
  }

  // 6. Update Profile (Đồng bộ lên public.profiles nếu đã đăng nhập Supabase)
  const updateProfile = async (updatedData: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' }

    const updatedUser: AuthUser = {
      ...currentUser,
      ...updatedData,
      id: currentUser.id,
      role: currentUser.role,
    }

    try {
      const supabase = createClient()
      if (currentUser.id && currentUser.id.length > 20) {
        await supabase
          .from('profiles')
          .update({
            name: updatedUser.name,
            phone_number: updatedUser.phoneNumber,
            avatar_url: updatedUser.avatar,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id)
      }
    } catch (err) {
      console.warn('Lỗi update profile lên Supabase:', err)
    }

    saveUserToStorage(updatedUser)
    return { success: true }
  }

  // 7. Logout
  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Lỗi signOut Supabase:', err)
    }
    saveUserToStorage(null)
    setIsProfileModalOpen(false)
  }

  const logoutAdmin = () => {
    saveAdminAuthToStorage(false)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdminAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isProfileModalOpen,
        setIsProfileModalOpen,
        updateProfile,
        loginWithGoogle,
        loginWithApple,
        loginWithFacebook,
        loginWithTwitter,
        registerWithCredentials,
        loginWithCredentials,
        loginAdmin,
        logout,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
