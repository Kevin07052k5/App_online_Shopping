'use client'

import {
  ShieldAlert,
  BrainCircuit,
  CheckCircle,
  PhoneCall,
  Ban,
  X,
  FileJson,
  AlertTriangle,
  Globe,
  Clock,
  CreditCard,
  Laptop,
} from 'lucide-react'
import { EncryptedOrderRecord } from '@/lib/types'

interface XaiDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: EncryptedOrderRecord | null
  onApprove: (orderId: string) => void
  onCallVerify: (orderId: string) => void
  onReject: (orderId: string) => void
}

export function XaiDetailModal({
  isOpen,
  onClose,
  order,
  onApprove,
  onCallVerify,
  onReject,
}: XaiDetailModalProps) {
  if (!isOpen || !order) return null

  const analysis = order.ai_analysis
  const isHigh = analysis.riskLevel === 'HIGH'
  const isMedium = analysis.riskLevel === 'MEDIUM'

  const scoreColor = isHigh
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : isMedium
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-11 items-center justify-center rounded-xl border ${scoreColor}`}>
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Hồ Sơ Phân Tích Explainable AI (XAI)</h3>
                <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-mono text-slate-300">
                  {order.orderCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mô hình: <span className="text-emerald-400 font-semibold">{analysis.model}</span> · Thời điểm: {analysis.analyzedAt.slice(0, 19).replace('T', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-xs">
          {/* Risk Score & Decision Gauge */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                Điểm Rủi Ro (Risk Score)
              </span>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className={`text-4xl font-black ${isHigh ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {analysis.riskScore}
                </span>
                <span className="text-slate-500 font-mono">/100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${analysis.riskScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                Cấp Độ Rủi Ro
              </span>
              <div className="mt-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${scoreColor}`}>
                  {analysis.riskLevel} RISK
                </span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {isHigh ? 'Mối đe dọa cao' : isMedium ? 'Cần thẩm tra' : 'Mức độ an toàn'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                Khuyến Nghị AI
              </span>
              <div className="mt-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black font-mono ${
                  analysis.decision === 'HOLD_REVIEW'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : analysis.decision === 'CHALLENGE_OTP'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {analysis.decision}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {analysis.decision === 'HOLD_REVIEW'
                  ? 'Tạm giữ xét duyệt'
                  : analysis.decision === 'CHALLENGE_OTP'
                  ? 'Xác thực OTP'
                  : 'Chấp thuận ngay'}
              </p>
            </div>
          </div>

          {/* AI Reasoning List (Explainability) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="size-4 text-amber-400" />
              <span>Các yếu tố phân tích cụ thể (Explainable AI Features):</span>
            </h4>
            <ul className="space-y-2">
              {analysis.reasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-slate-300 text-xs"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
              <span className="font-semibold text-blue-300 block mb-1">
                Tóm lược quyết định cho Chuyên viên An ninh:
              </span>
              <p className="text-slate-200 leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="font-bold text-white mb-3 text-xs flex items-center gap-1.5">
              <FileJson className="size-4 text-emerald-400" />
              <span>Transaction Payload Thực Tế:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <CreditCard className="size-3" /> Tổng tiền
                </span>
                <p className="font-bold text-amber-300 font-mono mt-1">
                  {order.total_amount.toLocaleString('vi-VN')}₫
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Globe className="size-3" /> Client IP / Quốc gia
                </span>
                <p className="font-mono text-white mt-1">
                  {order.client_ip} ({order.ip_country})
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="size-3" /> Thời gian duyệt giỏ
                </span>
                <p className="font-mono text-white mt-1">
                  {order.cart_duration_seconds} giây
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Laptop className="size-3" /> Thanh toán
                </span>
                <p className="font-mono text-white mt-1">
                  {order.payment_method}
                </p>
              </div>
            </div>

            <div className="mt-2.5 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-[11px] text-slate-400 font-mono truncate">
              User-Agent: {order.device_fingerprint}
            </div>
          </div>
        </div>

        {/* Action Buttons for Admin */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Đóng
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onReject(order.id)
                onClose()
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <Ban className="size-3.5" />
              Hủy & Chặn Vĩnh Viễn
            </button>

            <button
              onClick={() => {
                onCallVerify(order.id)
                onClose()
              }}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <PhoneCall className="size-3.5" />
              Yêu Cầu Gọi Xác Minh
            </button>

            <button
              onClick={() => {
                onApprove(order.id)
                onClose()
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition"
            >
              <CheckCircle className="size-3.5" />
              Chấp Thuận Đơn Hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
