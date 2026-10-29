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
  loginWithOAuth: (provider: 'google' | 'apple' | 'facebook' | 'twitter') => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: (customAccount?: { name?: string; email?: string; avatar?: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string }>
  loginWithApple: (customAccount?: { name?: string; email?: string; avatar?: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string }>
  loginWithFacebook: (customAccount?: { name?: string; email?: string; avatar?: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string }>
  loginWithTwitter: (customAccount?: { name?: string; email?: string; avatar?: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string }>
  registerWithCredentials: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>
  loginWithCredentials: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; isAdmin?: boolean; error?: string }>
  loginAdmin: (username: string, pass: string) => { success: boolean; error?: string }
  isProfileModalOpen: boolean
  setIsProfileModalOpen: (open: boolean) => void
  updateProfile: (updatedData: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  logoutAdmin: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false)

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

  // Đồng bộ thông tin người dùng từ Supabase session
  const syncUserFromSupabase = async (sessionUser: any) => {
    if (!sessionUser) return
    const metadata = sessionUser.user_metadata || {}
    const cleanEmail = sessionUser.email || metadata.email || ''
    const cleanName =
      metadata.full_name || metadata.name || cleanEmail.split('@')[0] || 'Khách hàng'
    const avatar =
      metadata.avatar_url ||
      metadata.picture ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'
    const rawProvider = (sessionUser.app_metadata?.provider || 'GOOGLE').toUpperCase()
    const provider = ['GOOGLE', 'APPLE', 'FACEBOOK', 'TWITTER', 'CREDENTIALS'].includes(rawProvider)
      ? rawProvider
      : 'GOOGLE'

    let phone = metadata.phone_number || metadata.phone || ''
    let role: 'USER' | 'ADMIN' = 'USER'

    try {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle()

      if (profile) {
        phone = profile.phone_number || phone
        role = (profile.role as any) || 'USER'
      } else {
        await supabase.from('profiles').upsert({
          id: sessionUser.id,
          email: cleanEmail,
          name: cleanName,
          phone_number: phone,
          role: 'USER',
          provider: provider as any,
          avatar_url: avatar,
        })
      }
    } catch (err) {
      console.warn('Sync profile error:', err)
    }

    const authUser: AuthUser = {
      id: sessionUser.id,
      name: cleanName,
      email: cleanEmail,
      phoneNumber: phone,
      role: role,
      provider: provider as any,
      avatar: avatar,
      createdAt: sessionUser.created_at || new Date().toISOString(),
    }

    saveUserToStorage(authUser)
    setIsAuthModalOpen(false)
  }

  // Khởi tạo state và lắng nghe sự kiện đăng nhập thực tế từ Supabase Auth
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

    try {
      const supabase = createClient()

      // Tự động đối soát authorization code nếu Supabase redirect về trang chủ
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        if (code) {
          supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            if (data?.session?.user) {
              syncUserFromSupabase(data.session.user)
              window.history.replaceState({}, document.title, window.location.pathname)
            } else if (error) {
              console.warn('Code exchange from URL search params error:', error)
            }
          })
        }
      }

      // Lấy phiên đăng nhập hiện tại nếu có
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncUserFromSupabase(session.user)
        }
      })

      // Lắng nghe sự kiện đăng nhập qua OAuth / đăng xuất thực tế
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await syncUserFromSupabase(session.user)
        } else if (event === 'SIGNED_OUT') {
          const savedAdmin = localStorage.getItem('GROUP9_ADMIN_AUTH')
          if (savedAdmin !== 'true') {
            setCurrentUser(null)
            localStorage.removeItem('GROUP9_CURRENT_USER')
          }
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (e) {
      console.warn('Supabase auth listener initialization error:', e)
    }
  }, [])

  // Đăng nhập OAuth thật (Google, Apple, Facebook, Twitter) sử dụng tài khoản trên máy người dùng
  const loginWithOAuth = async (
    provider: 'google' | 'apple' | 'facebook' | 'twitter'
  ): Promise<{ success: boolean; error?: string; code?: string }> => {
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = `${origin}/auth/callback`

      const options: {
        redirectTo: string
        queryParams?: Record<string, string>
        skipBrowserRedirect: boolean
      } = {
        redirectTo,
        skipBrowserRedirect: true,
      }

      // Đối với Google: thêm prompt select_account để luôn hiển thị danh sách các tài khoản Google thực tế đang đăng nhập trên trình duyệt của máy khách hàng
      if (provider === 'google') {
        options.queryParams = {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options,
      })

      if (error) {
        console.error(`Supabase OAuth ${provider} error:`, error)
        return { success: false, error: error.message }
      }

      if (!data?.url) {
        return { success: false, error: 'Không nhận được đường dẫn xác thực từ Supabase.' }
      }

      // Kiểm tra trước (Pre-flight probe) xem Provider đã được bật trên Supabase Dashboard chưa
      // Tránh việc trình duyệt chuyển hướng người dùng tới trang lỗi JSON thô 400
      try {
        const probe = await fetch(data.url, { redirect: 'manual' })
        if (probe.status === 400) {
          const json = await probe.json().catch(() => null)
          if (
            json?.msg?.toLowerCase().includes('provider is not enabled') ||
            json?.error_code === 'validation_failed'
          ) {
            return {
              success: false,
              code: 'PROVIDER_NOT_ENABLED',
              error: `Cổng xác thực ${provider.toUpperCase()} chưa được bật trong Supabase Dashboard (Authentication > Providers > ${provider.toUpperCase()}).`,
            }
          }
        }
      } catch (probeErr) {
        // Bỏ qua lỗi CORS probe để cho phép trình duyệt redirect bình thường
      }

      if (typeof window !== 'undefined') {
        window.location.href = data.url
      }

      return { success: true }
    } catch (err: any) {
      console.error(`OAuth ${provider} exception:`, err)
      return { success: false, error: err.message || `Lỗi đăng nhập ${provider}` }
    }
  }

  const loginWithGoogle = async (customAccount?: {
    name?: string
    email?: string
    avatar?: string
    phoneNumber?: string
  }) => {
    if (customAccount?.email) {
      const googleUser: AuthUser = {
        id: `usr-gg-${Date.now()}`,
        name: customAccount.name || 'Người dùng Google',
        email: customAccount.email,
        phoneNumber: customAccount.phoneNumber || '0908123456',
        role: 'USER',
        provider: 'GOOGLE',
        avatar:
          customAccount.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      }
      saveUserToStorage(googleUser)
      setIsAuthModalOpen(false)
      return { success: true }
    }
    return loginWithOAuth('google')
  }

  const loginWithApple = async (customAccount?: {
    name?: string
    email?: string
    avatar?: string
    phoneNumber?: string
  }) => {
    if (customAccount?.email) {
      const appleUser: AuthUser = {
        id: `usr-apple-${Date.now()}`,
        name: customAccount.name || 'Người dùng Apple',
        email: customAccount.email,
        phoneNumber: customAccount.phoneNumber || '0977665544',
        role: 'USER',
        provider: 'APPLE',
        avatar:
          customAccount.avatar ||
          'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      }
      saveUserToStorage(appleUser)
      setIsAuthModalOpen(false)
      return { success: true }
    }
    return loginWithOAuth('apple')
  }

  const loginWithFacebook = async (customAccount?: {
    name?: string
    email?: string
    avatar?: string
    phoneNumber?: string
  }) => {
    if (customAccount?.email) {
      const fbUser: AuthUser = {
        id: `usr-fb-${Date.now()}`,
        name: customAccount.name || 'Người dùng Facebook',
        email: customAccount.email,
        phoneNumber: customAccount.phoneNumber || '0988112233',
        role: 'USER',
        provider: 'FACEBOOK',
        avatar:
          customAccount.avatar ||
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      }
      saveUserToStorage(fbUser)
      setIsAuthModalOpen(false)
      return { success: true }
    }
    return loginWithOAuth('facebook')
  }

  const loginWithTwitter = async (customAccount?: {
    name?: string
    email?: string
    avatar?: string
    phoneNumber?: string
  }) => {
    if (customAccount?.email) {
      const twitterUser: AuthUser = {
        id: `usr-x-${Date.now()}`,
        name: customAccount.name || 'Người dùng X',
        email: customAccount.email,
        phoneNumber: customAccount.phoneNumber || '0919887766',
        role: 'USER',
        provider: 'TWITTER',
        avatar:
          customAccount.avatar ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
        createdAt: new Date().toISOString(),
      }
      saveUserToStorage(twitterUser)
      setIsAuthModalOpen(false)
      return { success: true }
    }
    return loginWithOAuth('twitter')
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
        loginWithOAuth,
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
