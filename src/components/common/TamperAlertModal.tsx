'use client'

import React from 'react'
import { AlertOctagon, RotateCcw, X, ShieldX, Lock } from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

export function TamperAlertModal() {
  const {
    isTamperAlertOpen,
    setIsTamperAlertOpen,
    tamperAlertDetails,
    restoreTampered,
    orders,
  } = useSecurityOrder()

  if (!isTamperAlertOpen || !tamperAlertDetails) return null

  const targetOrder = orders.find((o) => o.orderCode === tamperAlertDetails.orderCode)

  const handleRestore = async () => {
    if (targetOrder) {
      await restoreTampered(targetOrder.id)
    }
    setIsTamperAlertOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-rose-500 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(244,63,94,0.4)] p-6">
        <button
          onClick={() => setIsTamperAlertOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3 border-b border-rose-900/50 pb-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse">
            <AlertOctagon className="size-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-rose-400 uppercase tracking-tight">
              VI PHẠM TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU!
            </h3>
            <p className="text-xs text-rose-300 font-medium">
              Đơn hàng: <span className="font-mono font-bold text-white">{tamperAlertDetails.orderCode}</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5 text-xs">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-200">
            <p className="font-bold text-sm leading-snug">
              🚨 PHÁT HIỆN DỮ LIỆU ĐÃ BỊ CAN THIỆP TRÁI PHÉP TRÊN CSDL!
            </p>
            <p className="mt-1 text-xs text-rose-300">
              Mã Checksum SHA-256 không khớp với bản niêm phong ban đầu. Thẻ xác thực GMAC của thuật toán AES-256-GCM bị vô hiệu hóa!
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <Lock className="size-3.5 text-rose-400" />
              <span>Cơ Chế Phòng Thủ Mật Mã Xác Thực (Authenticated Encryption):</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Kẻ tấn công (hoặc quản trị viên cơ sở dữ liệu biến chất) đã cố tình sửa đổi 1 byte trong Ciphertext của bảng Database. Nhờ cơ chế <strong className="text-white">GMAC Tag của AES-GCM</strong>, hệ thống phát hiện ngay lập tức dữ liệu bị hỏng và từ chối xuất hóa đơn/giao hàng.
            </p>
            {tamperAlertDetails.report.errorDetails && (
              <div className="rounded-xl bg-slate-950 p-2.5 font-mono text-[11px] text-rose-300 border border-rose-950">
                Chi tiết: {tamperAlertDetails.report.errorDetails}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-300 text-[11px]">
            🛡️ <span className="font-bold">Hành động bảo vệ tự động:</span> Đơn hàng đã bị cách ly an ninh, khóa xuất kho và thông báo tới đội ngũ kiểm toán hệ thống.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={() => setIsTamperAlertOpen(false)}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Đóng Cảnh Báo
          </button>

          {targetOrder && (
            <button
              onClick={handleRestore}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950"
            >
              <RotateCcw className="size-3.5" />
              Khôi Phục Dữ Liệu Gốc Hợp Lệ
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
