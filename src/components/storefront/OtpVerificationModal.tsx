'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Smartphone,
  RefreshCw,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useMarketplace } from '@/src/context/MarketplaceContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { OrderItemSummary } from '@/src/types/order'

export function OtpVerificationModal() {
  const {
    cart,
    subtotal,
    discountAmount,
    shippingFee,
    finalTotal,
    appliedVoucher,
    isOtpModalOpen,
    setIsOtpModalOpen,
    pendingCheckoutPayload,
    setPendingCheckoutPayload,
    clearCart,
  } = useMarketplace()

  const {
    createAndEncryptOrder,
    setSelectedOrderForCrypto,
    setIsCryptoVisualizerOpen,
  } = useSecurityOrder()

  const [otpInput, setOtpInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [isVerifying, setIsVerifying] = useState(false)
  const mockOtp = '849201'

  useEffect(() => {
    if (!isOtpModalOpen) {
      setOtpInput('')
      setErrorMsg('')
      setCountdown(60)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOtpModalOpen])

  if (!isOtpModalOpen || !pendingCheckoutPayload) return null

  const handleVerify = async () => {
    if (otpInput.trim() !== mockOtp) {
      setErrorMsg('Mã OTP không khớp! Vui lòng nhập đúng 6 số mô phỏng hiển thị bên dưới.')
      return
    }

    setIsVerifying(true)
    try {
      const itemsSummary: OrderItemSummary[] = cart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        category: i.product.category,
        image: i.product.image,
      }))

      const createdOrder = await createAndEncryptOrder({
        pii: pendingCheckoutPayload.pii,
        items: itemsSummary,
        subtotalAmount: subtotal,
        discountAmount,
        shippingFee,
        finalTotalAmount: finalTotal,
        appliedVoucherCode: appliedVoucher?.code,
        paymentMethod: pendingCheckoutPayload.telemetry.paymentMethod as any,
        telemetry: pendingCheckoutPayload.telemetry,
        aiExplanation: {
          riskScore: 55,
          riskLevel: 'MEDIUM',
          decision: 'CHALLENGE_OTP',
          reasons: [
            'Giao dịch thanh toán Thẻ Tín Dụng Quốc Tế có giá trị cao',
            'Đã vượt qua bước xác thực 2 yếu tố SMS OTP thành công',
          ],
          summary: 'Xác thực 2 yếu tố thành công. Đơn hàng được phê duyệt thanh toán.',
          modelName: 'gemini-1.5-flash',
          evaluatedAt: new Date().toISOString(),
        },
      })

      clearCart()
      setPendingCheckoutPayload(null)
      setIsOtpModalOpen(false)

      // Open Crypto Visualizer
      setSelectedOrderForCrypto(createdOrder)
      setIsCryptoVisualizerOpen(true)
    } catch (err: any) {
      console.error('Error verifying OTP:', err)
      setErrorMsg('Lỗi mã hóa đơn hàng: ' + err.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleQuickFill = () => {
    setOtpInput(mockOtp)
    setErrorMsg('')
  }

  const phone = pendingCheckoutPayload.pii.phoneNumber
  const maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-3)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <button
          onClick={() => setIsOtpModalOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Xác Thực Thích Ứng (Adaptive OTP)</h3>
            <p className="text-xs text-amber-400 font-medium">
              Gemini AI phát hiện giao dịch Thẻ cần xác thực bổ sung
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Hệ thống nhận thấy đơn hàng có giá trị cao hoặc kết nối từ thiết bị mới. Chúng tôi đã gửi mã xác thực 6 số đến số điện thoại{' '}
            <strong className="text-white font-mono">{maskedPhone}</strong>.
          </p>

          {/* Test Preset Box for Defense Council */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Smartphone className="size-3.5" />
                MÃ OTP MÔ PHỎNG DÀNH CHO HỘI ĐỒNG:
              </span>
              <button
                type="button"
                onClick={handleQuickFill}
                className="rounded-lg bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 hover:bg-amber-300 transition"
              >
                Nhập nhanh
              </button>
            </div>
            <div className="mt-1 text-center font-mono text-2xl font-black tracking-widest text-white">
              {mockOtp}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 text-center">
              Nhập mã xác thực 6 chữ số:
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
              className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
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
            onClick={() => setIsOtpModalOpen(false)}
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Hủy Giao Dịch
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex-1 flex items-center justify-center gap-1 rounded-2xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
          >
            {isVerifying ? (
              <>
                <Sparkles className="size-3.5 animate-spin" />
                <span>Đang Mã Hóa...</span>
              </>
            ) : (
              <>
                <span>Xác Nhận OTP</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
