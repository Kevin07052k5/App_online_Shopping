'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Smartphone, CheckCircle, RefreshCw, X, ArrowRight } from 'lucide-react'

interface OtpChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  phone: string
  mockOtp?: string
}

export function OtpChallengeModal({
  isOpen,
  onClose,
  onSuccess,
  phone,
  mockOtp = '849201',
}: OtpChallengeModalProps) {
  const [otpInput, setOtpInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (!isOpen) {
      setOtpInput('')
      setErrorMsg('')
      setCountdown(60)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen) return null

  const handleVerify = () => {
    if (otpInput.trim() === mockOtp) {
      setErrorMsg('')
      onSuccess()
    } else {
      setErrorMsg('Mã OTP không chính xác! Vui lòng kiểm tra lại hoặc dùng mã mô phỏng bên dưới.')
    }
  }

  const handleQuickFill = () => {
    setOtpInput(mockOtp)
    setErrorMsg('')
  }

  const maskedPhone = phone
    ? phone.slice(0, 3) + '****' + phone.slice(-3)
    : '098****888'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Xác Thực Thích Ứng (Adaptive OTP)</h3>
            <p className="text-xs text-amber-400 font-medium">
              Phát hiện giao dịch cần xác minh 2 yếu tố
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Hệ thống AI Fraud Detector nhận thấy giao dịch có giá trị cao hoặc từ thiết bị mới. Chúng tôi đã gửi mã xác thực 6 số đến số điện thoại{' '}
            <strong className="text-white font-mono">{maskedPhone}</strong>.
          </p>

          {/* Test Preset Box for Thesis Defense */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <Smartphone className="size-3.5" />
                MÃ OTP MÔ PHỎNG DÀNH CHO HỘI ĐỒNG:
              </span>
              <button
                onClick={handleQuickFill}
                className="rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Nhập nhanh
              </button>
            </div>
            <div className="mt-1 text-center font-mono text-2xl font-black tracking-widest text-white">
              {mockOtp}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5 text-center">
              Nhập mã 6 chữ số:
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value)
                setErrorMsg('')
              }}
              placeholder="Nhập 6 số..."
              className="w-full text-center tracking-[0.5em] font-mono text-xl py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300 text-center font-semibold text-[11px]">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>
              Hết hạn sau:{' '}
              <strong className="text-white font-mono">
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </strong>
            </span>
            <button
              onClick={() => setCountdown(60)}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-300"
            >
              <RefreshCw className="size-3" />
              Gửi lại mã
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Hủy Giao Dịch
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
          >
            <span>Xác Nhận OTP</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
