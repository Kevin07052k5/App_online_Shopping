'use client'

import { ShieldAlert, AlertOctagon, RotateCcw, X, Lock } from 'lucide-react'

interface TamperAlertModalProps {
  isOpen: boolean
  onClose: () => void
  orderCode: string
  errorDetail?: string
  onRestore?: () => void
}

export function TamperAlertModal({
  isOpen,
  onClose,
  orderCode,
  errorDetail,
  onRestore,
}: TamperAlertModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-rose-500 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(244,63,94,0.4)] p-6">
        <button
          onClick={onClose}
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
            <h3 className="text-lg font-black text-rose-400 uppercase tracking-tight">
              Cảnh Báo An Ninh: Phát Hiện Xâm Nhập CSDL!
            </h3>
            <p className="text-xs text-rose-300 font-medium">
              Đơn hàng: <span className="font-mono font-bold text-white">{orderCode}</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5 text-xs">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-200">
            <p className="font-bold text-sm leading-snug">
              🚨 PHÁT HIỆN DỮ LIỆU ĐÃ BỊ THAY ĐỔI TRÁI PHÉP!
            </p>
            <p className="mt-1 text-xs text-rose-300">
              Mã Checksum SHA-256 không khớp với bản gốc. Thẻ xác thực GMAC của thuật toán AES-256-GCM bị vô hiệu hóa!
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <Lock className="size-3.5 text-rose-400" />
              <span>Phân Tích Cơ Chế Phòng Thủ Mật Mã (Zero-Trust):</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Kẻ tấn công (hoặc hacker nội bộ) đã thâm nhập thẳng vào bảng Database và cố tình sửa đổi 1 byte trong chuỗi bản mã hoặc giá trị bản ghi. 
              Nhờ cơ chế <strong className="text-white">Authenticated Encryption (AES-GCM)</strong>, việc giải mã lập tức phát sinh lỗi toàn vẹn và bị hệ thống từ chối truy cập.
            </p>
            {errorDetail && (
              <div className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-rose-300 border border-rose-950">
                Chi tiết: {errorDetail}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-300 text-[11px]">
            🛡️ <span className="font-bold">Hành động bảo vệ tự động:</span> Bản ghi đã bị đánh dấu cô lập (Quarantine), khóa chức năng xuất hóa đơn và phát thông báo an ninh đến bộ phận SOC.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Đóng Cảnh Báo
          </button>

          {onRestore && (
            <button
              onClick={() => {
                onRestore()
                onClose()
              }}
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
