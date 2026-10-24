'use client'

import React, { useState } from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  Ticket,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  CheckCircle,
} from 'lucide-react'
import { useMarketplace } from '@/src/context/MarketplaceContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { formatVND } from '@/src/utils/helpers'

export function CartDrawer() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    setIsCheckoutModalOpen,
    vouchers,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    subtotal,
    discountAmount,
    shippingFee,
    finalTotal,
    cartCount,
  } = useMarketplace()

  const { showToast } = useSecurityOrder()

  const [voucherInput, setVoucherInput] = useState('')
  const [voucherFeedback, setVoucherFeedback] = useState<{
    success: boolean
    message: string
  } | null>(null)

  if (!isCartDrawerOpen) return null

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherInput.trim()) return
    const res = applyVoucher(voucherInput)
    setVoucherFeedback(res)
    if (res.success) {
      showToast('SUCCESS', 'Đã áp dụng voucher', res.message)
      setVoucherInput('')
    } else {
      showToast('WARNING', 'Không thể áp dụng', res.message)
    }
  }

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return
    setIsCartDrawerOpen(false)
    setIsCheckoutModalOpen(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-[#ee4d2d] text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            <h3 className="font-bold text-base">Giỏ Hàng Của Bạn ({cartCount})</h3>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Cart item list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Sản phẩm đã chọn
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-600 font-semibold text-[11px]"
                >
                  Xóa giỏ hàng
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400">
                <ShoppingBag className="size-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Giỏ hàng của bạn đang trống</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hãy thêm một vài sản phẩm để trải nghiệm tính năng bảo mật AI!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="size-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-slate-900 truncate">{item.product.name}</h5>
                      <span className="text-[11px] text-[#ee4d2d] font-bold font-mono">
                        {formatVND(item.product.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="flex size-6 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="flex size-6 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-1 text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher Section */}
          <div className="rounded-2xl border border-slate-200 bg-orange-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Ticket className="size-4 text-[#ee4d2d]" />
                Mã Giảm Giá Sàn TMĐT
              </span>
              {appliedVoucher && (
                <button
                  onClick={() => {
                    removeVoucher()
                    showToast('INFO', 'Đã gỡ mã voucher', 'Giá thanh toán đã được cập nhật lại.')
                  }}
                  className="text-[11px] text-rose-600 font-bold hover:underline"
                >
                  Gỡ mã
                </button>
              )}
            </div>

            {appliedVoucher ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-2.5 flex items-center justify-between text-xs text-emerald-800">
                <div>
                  <span className="font-bold font-mono text-emerald-700">{appliedVoucher.code}</span>
                  <p className="text-[11px] text-emerald-600">{appliedVoucher.name}</p>
                </div>
                <CheckCircle className="size-4 text-emerald-600" />
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher..."
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono uppercase focus:border-[#ee4d2d] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#ee4d2d] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#d94124] transition"
                >
                  Áp dụng
                </button>
              </form>
            )}

            {voucherFeedback && (
              <div
                className={`text-[11px] font-semibold ${
                  voucherFeedback.success ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {voucherFeedback.message}
              </div>
            )}

            {/* Quick Voucher Suggestions */}
            <div className="pt-2 border-t border-orange-100 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">
                Gợi ý mã giảm giá có sẵn:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vouchers.map((v) => (
                  <button
                    key={v.code}
                    onClick={() => {
                      const res = applyVoucher(v.code)
                      setVoucherFeedback(res)
                      if (res.success) {
                        showToast('SUCCESS', 'Đã áp dụng voucher', res.message)
                      } else {
                        showToast('WARNING', 'Không thể áp dụng', res.message)
                      }
                    }}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition ${
                      v.isExploitMock
                        ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border-orange-200 bg-white text-orange-800 hover:bg-orange-100'
                    }`}
                  >
                    {v.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tổng tiền hàng:</span>
              <span className="font-mono">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển (SPX Express):</span>
              <span className="font-mono">
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-bold">Miễn phí</span>
                ) : (
                  formatVND(shippingFee)
                )}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#ee4d2d] font-semibold">
                <span>Giảm giá Voucher:</span>
                <span className="font-mono">-{formatVND(discountAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Tổng thanh toán:</span>
              <span className="text-[#ee4d2d] font-mono text-base">{formatVND(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 p-5 bg-white space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Dữ liệu đơn hàng được mã hóa AES-256-GCM bảo vệ PII</span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ee4d2d] py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-[#d94124] disabled:opacity-50 transition active:scale-98"
          >
            <span>Mua Hàng ({cartCount}) • {formatVND(finalTotal)}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
