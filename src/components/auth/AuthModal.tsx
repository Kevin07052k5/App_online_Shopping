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
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import SocialAuthSection from './SocialAuthSection'

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
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
      >
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

          {/* Social Logins (Google, Apple, Facebook, Twitter / X) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
              Đăng nhập nhanh bằng tài khoản mạng xã hội:
            </span>
            <SocialAuthSection onSuccess={handleClose} />
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
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-8 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
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
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-8 text-xs focus:border-[#ee4d2d] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
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


    </div>
  )
}
