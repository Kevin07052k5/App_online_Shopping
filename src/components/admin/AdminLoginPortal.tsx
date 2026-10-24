'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  ArrowLeft,
  AlertTriangle,
  Server,
  Fingerprint,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { FaceBiometricModal } from '@/src/components/biometric/FaceBiometricModal'
import { BiometricVerificationResult } from '@/src/types/biometric'

export function AdminLoginPortal() {
  const { loginAdmin } = useAuth()
  const { showToast } = useSecurityOrder()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = loginAdmin(username, password)
    setIsLoading(false)

    if (result.success) {
      showToast('SUCCESS', 'Xác thực thành công', 'Chào mừng Quản trị viên truy cập Group 9 Security Hub!')
    } else {
      setError(result.error || 'Đăng nhập thất bại!')
      showToast('DANGER', 'Từ chối truy cập', 'Tên đăng nhập hoặc mật khẩu không chính xác.')
    }
  }

  const handleFaceVerified = (result: BiometricVerificationResult) => {
    setIsFaceModalOpen(false)
    if (result.success) {
      loginAdmin('admin', 'admin')
      showToast(
        'SUCCESS',
        'Xác thực SFace Face ID Thành Công',
        `Chào mừng Quản trị viên! Độ tương đồng SFace: ${(result.cosineSimilarity * 100).toFixed(1)}%.`
      )
    }
  }

  const handleQuickAutofill = () => {
    setUsername('admin')
    setPassword('admin')
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Storefront Link */}
      <div className="absolute top-6 left-6 z-20">
        <a
          href="/"
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition shadow"
        >
          <ArrowLeft className="size-4" />
          <span>Về Cửa Hàng Group 9</span>
        </a>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20">
            <div className="flex size-full items-center justify-center rounded-[22px] bg-slate-950">
              <ShieldCheck className="size-8 text-emerald-400" />
            </div>
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2">
              <Fingerprint className="size-3" />
              <span>Cổng Quản Trị An Ninh &amp; Kho Vận</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Group 9 Security Hub</h1>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống Giám sát Gian lận AI &amp; Quản trị CSDL Mã hóa AES-256-GCM
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200">
            <AlertTriangle className="size-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tên Đăng Nhập Quản Trị
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 size-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Nhập 'admin'"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Mật Khẩu Quản Trị
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Nhập 'admin'"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Quick Autofill Helper for Thesis Defense */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-[11px]">Tài khoản mẫu:</span>
                <p className="text-[10px] text-emerald-400/80 font-mono">admin / admin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickAutofill}
              className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition active:scale-95"
            >
              Điền nhanh
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 transition active:scale-98 disabled:opacity-50"
          >
            <span>Đăng Nhập Bằng Mật Khẩu</span>
            <ArrowRight className="size-4" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 my-2 text-slate-600 text-[10px]">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="uppercase font-bold tracking-wider">Hoặc xác thực sinh học</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* SFace Face ID Login Button */}
          <button
            type="button"
            onClick={() => setIsFaceModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-slate-900 py-3 text-xs font-bold text-cyan-300 shadow hover:border-cyan-400 hover:bg-cyan-950/60 transition active:scale-98"
          >
            <Fingerprint className="size-4 text-cyan-400" />
            <span>Quét Khuôn Mặt SFace (Face ID AI Shield)</span>
          </button>
        </form>

        {/* Security badges */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Server className="size-3 text-slate-400" />
            AES-256-GCM
          </span>
          <span>•</span>
          <span>sface.onnx 128-D</span>
          <span>•</span>
          <span>Gemini 1.5 XAI</span>
        </div>
      </div>

      {/* Face Biometric Modal */}
      <FaceBiometricModal
        isOpen={isFaceModalOpen}
        title="Group 9 Security Hub — SFace Face ID"
        subtitle="Xác thực sinh trắc học khuôn mặt Quản trị viên chống giả mạo"
        targetRole="ADMIN"
        onVerified={handleFaceVerified}
        onCancel={() => setIsFaceModalOpen(false)}
      />
    </div>
  )
}
