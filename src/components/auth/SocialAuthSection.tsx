'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { Loader2, ExternalLink, X, AlertTriangle, CheckCircle, Mail, User } from 'lucide-react'

type OAuthProvider = 'google' | 'apple' | 'facebook' | 'twitter'

interface SocialAuthSectionProps {
  onSuccess?: () => void
}

export default function SocialAuthSection({ onSuccess }: SocialAuthSectionProps) {
  const { loginWithGoogle, loginWithApple, loginWithFacebook, loginWithTwitter } = useAuth()
  const { showToast } = useSecurityOrder()
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)

  // State cho modal hỗ trợ khi provider chưa bật trên Supabase Dashboard
  const [helperProvider, setHelperProvider] = useState<OAuthProvider | null>(null)
  const [directEmail, setDirectEmail] = useState('')
  const [directName, setDirectName] = useState('')
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false)

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setLoadingProvider(provider)
    try {
      let res: { success: boolean; error?: string; code?: string } = { success: false }

      if (provider === 'google') {
        showToast('INFO', 'Kết nối Google', 'Đang kiểm tra và chuyển hướng tới tài khoản Google trên máy bạn...')
        res = await loginWithGoogle()
      } else if (provider === 'apple') {
        showToast('INFO', 'Kết nối Apple ID', 'Đang kiểm tra và chuyển hướng tới tài khoản Apple ID trên máy bạn...')
        res = await loginWithApple()
      } else if (provider === 'facebook') {
        showToast('INFO', 'Kết nối Facebook', 'Đang kiểm tra và chuyển hướng tới tài khoản Facebook trên máy bạn...')
        res = await loginWithFacebook()
      } else if (provider === 'twitter') {
        showToast('INFO', 'Kết nối X (Twitter)', 'Đang kiểm tra và chuyển hướng tới tài khoản X trên máy bạn...')
        res = await loginWithTwitter()
      }

      if (!res.success) {
        setLoadingProvider(null)
        if (res.code === 'PROVIDER_NOT_ENABLED') {
          setHelperProvider(provider)
          showToast('WARNING', 'Chưa kích hoạt Provider', res.error || 'Provider chưa được bật trong Supabase.')
        } else {
          showToast('WARNING', 'Xác thực tài khoản', res.error || 'Lỗi kết nối tới nhà cung cấp OAuth.')
        }
      } else if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setLoadingProvider(null)
      showToast('DANGER', 'Lỗi xác thực', err.message || 'Không thể mở cổng đăng nhập tài khoản.')
    }
  }

  // Xử lý đăng nhập bằng email thực tế trên máy người dùng nếu provider trên Supabase chưa được bật Client ID
  const handleDirectRealAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!directEmail.trim() || !directEmail.includes('@')) {
      showToast('WARNING', 'Email không hợp lệ', 'Vui lòng nhập địa chỉ email chính xác trên máy của bạn.')
      return
    }

    setIsSubmittingDirect(true)
    const email = directEmail.trim()
    const name = directName.trim() || email.split('@')[0]
    const p = helperProvider || 'google'

    let res: { success: boolean; error?: string } = { success: false }
    if (p === 'google') {
      res = await loginWithGoogle({ name, email })
    } else if (p === 'apple') {
      res = await loginWithApple({ name, email })
    } else if (p === 'facebook') {
      res = await loginWithFacebook({ name, email })
    } else if (p === 'twitter') {
      res = await loginWithTwitter({ name, email })
    }

    setIsSubmittingDirect(false)

    if (res.success) {
      showToast('SUCCESS', 'Đăng nhập thành công', `Chào mừng ${name} (${email}) đã đăng nhập!`)
      setHelperProvider(null)
      setDirectEmail('')
      setDirectName('')
      if (onSuccess) {
        onSuccess()
      }
    } else {
      showToast('DANGER', 'Đăng nhập thất bại', res.error || 'Vui lòng thử lại.')
    }
  }

  const getProviderName = (p: OAuthProvider | null) => {
    if (p === 'google') return 'Google'
    if (p === 'apple') return 'Apple ID'
    if (p === 'facebook') return 'Facebook'
    if (p === 'twitter') return 'X (Twitter)'
    return 'Mạng xã hội'
  }

  return (
    <div className="w-full my-4">
      {/* 4 NÚT HÌNH VUÔNG BO TRÒN THEO ĐÚNG MẪU (Chuẩn Modern SaaS) */}
      <div className="flex items-center justify-center gap-4">
        {/* 1. GOOGLE */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={loadingProvider !== null}
          className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          title="Đăng nhập bằng tài khoản Google trên máy bạn"
          aria-label="Đăng nhập bằng Google"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#4285F4]" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
        </button>

        {/* 2. APPLE */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('apple')}
          disabled={loadingProvider !== null}
          className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          title="Đăng nhập bằng tài khoản Apple ID trên máy bạn"
          aria-label="Đăng nhập bằng Apple ID"
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white" />
          ) : (
            <svg className="w-6 h-6 fill-black dark:fill-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.87c.65-.79 1.1-1.89.97-2.87-.94.04-2.07.63-2.73 1.41-.58.67-1.1 1.76-.96 2.82 1.05.08 2.07-.57 2.72-1.36z" />
            </svg>
          )}
        </button>

        {/* 3. FACEBOOK */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('facebook')}
          disabled={loadingProvider !== null}
          className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          title="Đăng nhập bằng tài khoản Facebook trên máy bạn"
          aria-label="Đăng nhập bằng Facebook"
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#1877F2]" />
          ) : (
            <svg className="w-7 h-7 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
        </button>

        {/* 4. X (TWITTER) */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('twitter')}
          disabled={loadingProvider !== null}
          className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          title="Đăng nhập bằng tài khoản X (Twitter) trên máy bạn"
          aria-label="Đăng nhập bằng X"
        >
          {loadingProvider === 'twitter' ? (
            <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white" />
          ) : (
            <svg className="w-5 h-5 fill-black dark:fill-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          )}
        </button>
      </div>

      {loadingProvider && (
        <p className="text-center text-[11px] text-orange-600 dark:text-orange-400 font-medium mt-3 animate-pulse">
          Đang kết nối cổng xác thực {getProviderName(loadingProvider)}...
        </p>
      )}

      {/* ============================================================== */}
      {/* MODAL HƯỚNG DẪN KHI SUPABASE CHƯA BẬT PROVIDER & ĐĂNG NHẬP NHANH */}
      {/* ============================================================== */}
      {helperProvider && (
        <div
          onClick={() => setHelperProvider(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kích hoạt OAuth {getProviderName(helperProvider)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cổng Supabase Auth: iztuzmxcsiwcqppqtjnl
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHelperProvider(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Thông báo chi tiết */}
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <p className="font-semibold mb-1">
                Lý do báo lỗi <code>Unsupported provider</code>:
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Nhà cung cấp <strong>{getProviderName(helperProvider)}</strong> trên dự án Supabase của bạn hiện chưa được bật Client ID / Secret trong phần Quản trị.
              </p>
            </div>

            {/* Hướng dẫn bật trên Supabase Dashboard */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Cách bật cổng {getProviderName(helperProvider)} thật:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <li>Truy cập Supabase Dashboard của dự án.</li>
                <li>Vào mục <strong>Authentication</strong> → <strong>Providers</strong>.</li>
                <li>Bật toggle <strong>{getProviderName(helperProvider)}</strong> và dán Client ID.</li>
              </ol>
              <a
                href="https://supabase.com/dashboard/project/iztuzmxcsiwcqppqtjnl/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ee4d2d] hover:underline pt-1"
              >
                <span>Mở Cài đặt Providers trên Supabase</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* Đăng nhập nhanh với tài khoản thực của khách hàng */}
            <form onSubmit={handleDirectRealAccountLogin} className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Hoặc nhập địa chỉ email {getProviderName(helperProvider)} trên máy bạn để tiếp tục:
              </span>

              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={`Ví dụ: yourname@${helperProvider === 'google' ? 'gmail.com' : 'example.com'}`}
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tên hiển thị (Tùy chọn)"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHelperProvider(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDirect || !directEmail.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-orange-600 hover:from-[#d94124] hover:to-orange-700 text-xs font-bold text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingDirect ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span>Đăng Nhập Ngay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
