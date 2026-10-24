'use client'

import React, { useState } from 'react'
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { GoogleAuthModal } from './GoogleAuthModal'
import { AppleAuthModal } from './AppleAuthModal'
import { FacebookAuthModal } from './FacebookAuthModal'
import { TwitterAuthModal } from './TwitterAuthModal'

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    registerWithCredentials,
    loginWithCredentials,
  } = useAuth()

  const { showToast } = useSecurityOrder()

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [isAppleModalOpen, setIsAppleModalOpen] = useState(false)
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false)
  const [isTwitterModalOpen, setIsTwitterModalOpen] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isAuthModalOpen) return null

  const handleClose = () => {
    setIsAuthModalOpen(false)
    setErrorMsg('')
  }

  // Handle Google Auth
  const handleGoogle = () => {
    setIsGoogleModalOpen(true)
  }

  // Handle Apple Auth
  const handleApple = () => {
    setIsAppleModalOpen(true)
  }

  // Handle Facebook Auth
  const handleFacebook = () => {
    setIsFacebookModalOpen(true)
  }

  // Handle Twitter Auth
  const handleTwitter = () => {
    setIsTwitterModalOpen(true)
  }

  // Handle Manual Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    const res = await registerWithCredentials({
      name,
      email,
      phoneNumber,
      password,
      confirmPassword,
      agreeTerms,
    })

    setIsLoading(false)

    if (res.success) {
      showToast('SUCCESS', 'Đăng ký thành công', `Chào mừng ${name} gia nhập nền tảng Group 9!`)
      setName('')
      setEmail('')
      setPhoneNumber('')
      setPassword('')
      setConfirmPassword('')
    } else {
      setErrorMsg(res.error || 'Đăng ký thất bại')
      showToast('WARNING', 'Đăng ký chưa thành công', res.error || 'Vui lòng kiểm tra lại thông tin')
    }
  }

  // Handle Manual Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    const res = await loginWithCredentials(loginIdentifier, loginPassword)
    setIsLoading(false)

    if (res.success) {
      if (res.isAdmin) {
        showToast('SUCCESS', 'Đăng nhập Quản Trị Viên', 'Đã xác thực quyền Admin Group 9.')
        // Redirect to /admin
        if (typeof window !== 'undefined') {
          window.location.href = '/admin'
        }
      } else {
        showToast('SUCCESS', 'Đăng nhập thành công', 'Chào mừng bạn quay trở lại!')
      }
    } else {
      setErrorMsg(res.error || 'Đăng nhập thất bại')
      showToast('DANGER', 'Đăng nhập thất bại', res.error || 'Tài khoản hoặc mật khẩu không chính xác')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-[#ee4d2d] via-orange-500 to-amber-500 p-6 text-white text-center">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="size-5" />
          </button>

          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur border border-white/30 shadow-inner mb-2">
            <ShieldCheck className="size-6 text-white" />
          </div>

          <h3 className="text-xl font-black tracking-tight">Group 9 Identity Portal</h3>
          <p className="text-xs text-orange-100 mt-1">
            Bảo vệ danh tính &amp; mã hóa PII chuẩn AES-256-GCM
          </p>

          {/* Mode Tabs */}
          <div className="mt-5 flex rounded-xl bg-black/20 p-1 backdrop-blur border border-white/20">
            <button
              onClick={() => {
                setAuthModalMode('LOGIN')
                setErrorMsg('')
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                authModalMode === 'LOGIN'
                  ? 'bg-white text-[#ee4d2d] shadow'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                setAuthModalMode('REGISTER')
                setErrorMsg('')
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                authModalMode === 'REGISTER'
                  ? 'bg-white text-[#ee4d2d] shadow'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Đăng Ký Tài Khoản
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Social Logins (Google, Apple ID, Facebook, X) - Modern SaaS / Clean Enterprise */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
              Đăng nhập nhanh bằng tài khoản mạng xã hội
            </span>

            {/* 4 NÚT HÌNH VUÔNG BO TRÒN THEO ĐÚNG MẪU (Chuẩn Modern SaaS) */}
            <div className="flex items-center justify-center gap-4 my-4">
              {/* 1. GOOGLE */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                title="Đăng nhập với Google"
                aria-label="Đăng nhập với Google"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </button>

              {/* 2. APPLE (Chuẩn vector 24x24 không bao giờ lỗi icon) */}
              <button
                type="button"
                onClick={handleApple}
                disabled={isLoading}
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                title="Đăng nhập với Apple"
                aria-label="Đăng nhập với Apple"
              >
                <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.87c.65-.79 1.1-1.89.97-2.87-.94.04-2.07.63-2.73 1.41-.58.67-1.1 1.76-.96 2.82 1.05.08 2.07-.57 2.72-1.36z" />
                </svg>
              </button>

              {/* 3. FACEBOOK (Icon chữ f nền tròn xanh #1877F2 SVG) */}
              <button
                type="button"
                onClick={handleFacebook}
                disabled={isLoading}
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                title="Đăng nhập với Facebook"
                aria-label="Đăng nhập với Facebook"
              >
                <svg className="w-7 h-7 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* 4. X (TWITTER - Logo X nét đôi tối giản màu đen SVG) */}
              <button
                type="button"
                onClick={handleTwitter}
                disabled={isLoading}
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                title="Đăng nhập với X"
                aria-label="Đăng nhập với X"
              >
                <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400">
              {authModalMode === 'REGISTER'
                ? 'HOẶC ĐIỀN THÔNG TIN ĐĂNG KÝ'
                : 'HOẶC ĐĂNG NHẬP VỚI TÀI KHOẢN'}
            </span>
          </div>

          {/* Form Content */}
          {authModalMode === 'REGISTER' ? (
            /* REGISTER FORM (Điền thông tin) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và Tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa Chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="an.nguyen@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số Điện Thoại (Tạo Blind Index) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="0908123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs font-mono focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật Khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Ít nhất 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nhập Lại Mật Khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Xác nhận"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                    />
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d]"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tôi đồng ý với chính sách bảo vệ dữ liệu PII và mã hóa CSDL chuẩn AES-256-GCM của Group 9.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ee4d2d] to-orange-600 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-[#d94124] hover:to-orange-700 transition active:scale-98 disabled:opacity-50 mt-2"
              >
                <span>Tạo Tài Khoản Group 9</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Hoặc Tên Đăng Nhập
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nhập email hoặc 'admin'"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu hoặc 'admin'"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-10 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Admin Autofill Tip */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 p-2.5 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-600" />
                  Tài khoản Quản trị viên: <code className="font-bold">admin / admin</code>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('admin')
                    setLoginPassword('admin')
                  }}
                  className="rounded-lg bg-amber-200/80 dark:bg-amber-800/80 px-2 py-0.5 font-bold hover:bg-amber-300 transition text-[10px]"
                >
                  Điền nhanh
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ee4d2d] to-orange-600 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-[#d94124] hover:to-orange-700 transition active:scale-98 disabled:opacity-50 mt-2"
              >
                <span>Đăng Nhập</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 text-center text-[11px] text-slate-500">
          {authModalMode === 'REGISTER' ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                onClick={() => setAuthModalMode('LOGIN')}
                className="font-bold text-[#ee4d2d] hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => setAuthModalMode('REGISTER')}
                className="font-bold text-[#ee4d2d] hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Interactive Google, Apple, Facebook & Twitter / X Identity Modals */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
      <AppleAuthModal
        isOpen={isAppleModalOpen}
        onClose={() => setIsAppleModalOpen(false)}
      />
      <FacebookAuthModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
      />
      <TwitterAuthModal
        isOpen={isTwitterModalOpen}
        onClose={() => setIsTwitterModalOpen(false)}
      />
    </div>
  )
}
