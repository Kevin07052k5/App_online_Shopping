'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  BrainCircuit,
  Eye,
  CheckCircle,
  Ban,
  Clock,
  Globe,
  CreditCard,
  Laptop,
  AlertTriangle,
  X,
  FileJson,
} from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { EncryptedOrder } from '@/src/types/order'
import { formatVND } from '@/src/utils/helpers'

export function RiskAuditQueue() {
  const { orders, updateFulfillmentStatus } = useSecurityOrder()

  const [selectedOrder, setSelectedOrder] = useState<EncryptedOrder | null>(null)

  // Filter orders with MEDIUM or HIGH risk or status HOLD_REVIEW
  const queueOrders = orders.filter(
    (o) => o.aiExplanation.riskLevel !== 'LOW' || o.fulfillmentStatus === 'HOLD_REVIEW'
  )

  const handleApprove = (orderId: string) => {
    updateFulfillmentStatus(orderId, 'PAID_APPROVED')
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null)
    }
  }

  const handleReject = (orderId: string) => {
    updateFulfillmentStatus(orderId, 'CANCELLED')
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-400" />
            <span>Hàng Đợi Kiểm Duyệt Rủi Ro AI (Explainable AI Queue)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Các đơn hàng có điểm rủi ro MEDIUM hoặc HIGH do Gemini phát hiện cần chuyên viên thẩm định
          </p>
        </div>
        <span className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1 text-xs font-mono font-bold text-amber-400">
          {queueOrders.length} Đơn Cần Thẩm Tra
        </span>
      </div>

      {queueOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <CheckCircle className="size-10 text-emerald-400 mx-auto mb-3" />
          <h4 className="font-bold text-white text-sm">Hàng đợi rủi ro hiện đang sạch sẽ!</h4>
          <p className="text-xs mt-1">
            Mọi đơn hàng đều ở trạng thái an toàn hoặc đã được phê duyệt.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {queueOrders.map((ord) => {
            const isHigh = ord.aiExplanation.riskLevel === 'HIGH'
            return (
              <div
                key={ord.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-slate-700"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">
                      {ord.orderCode}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase font-mono ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Điểm rủi ro: {ord.aiExplanation.riskScore}/100 ({ord.aiExplanation.riskLevel})
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                      {ord.fulfillmentStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')} —{' '}
                    <strong className="text-amber-300 font-mono">
                      {formatVND(ord.finalTotalAmount)}
                    </strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Client IP: <strong className="text-slate-300 font-mono">{ord.clientIp}</strong></span>
                    <span>Tốc độ checkout: <strong className="text-slate-300">{ord.checkoutVelocitySec}s</strong></span>
                    <span>Thanh toán: <strong className="text-slate-300">{ord.paymentMethod}</strong></span>
                  </div>

                  {/* Top XAI reason snippet */}
                  <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 rounded-xl p-2.5 border border-rose-500/20">
                    <span className="font-bold">Lý do Gemini XAI:</span> {ord.aiExplanation.reasons[0]}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition"
                  >
                    <Eye className="size-3.5" />
                    Xem XAI Chi Tiết
                  </button>

                  <button
                    onClick={() => handleApprove(ord.id)}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-950"
                  >
                    Phê Duyệt Đơn
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Explainable AI (XAI) Modal Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <BrainCircuit className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Hồ Sơ Explainable AI (XAI)</h3>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                      {selectedOrder.orderCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mô hình: <span className="text-emerald-400 font-semibold">{selectedOrder.aiExplanation.modelName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-xs">
              {/* Score Gauge */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                    Điểm Rủi Ro (Risk Score)
                  </span>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-rose-400">
                      {selectedOrder.aiExplanation.riskScore}
                    </span>
                    <span className="text-slate-500 font-mono">/100</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                    Cấp Độ Rủi Ro
                  </span>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {selectedOrder.aiExplanation.riskLevel} RISK
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                    Khuyến Nghị AI
                  </span>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {selectedOrder.aiExplanation.decision}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason list */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="size-4 text-amber-400" />
                  <span>Các đặc trưng gian lận do AI phân tách (Explainable Features):</span>
                </h4>
                <ul className="space-y-2">
                  {selectedOrder.aiExplanation.reasons.map((reason, idx) => (
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
                    Tóm lược quyết định cho Kiểm duyệt viên:
                  </span>
                  <p className="text-slate-200 leading-relaxed">{selectedOrder.aiExplanation.summary}</p>
                </div>
              </div>

              {/* Transaction Payload */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <h4 className="font-bold text-white mb-3 text-xs flex items-center gap-1.5">
                  <FileJson className="size-4 text-emerald-400" />
                  <span>Transaction Payload Thực Tế:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-500 block">Tổng tiền</span>
                    <p className="font-bold text-amber-300 font-mono mt-1">
                      {formatVND(selectedOrder.finalTotalAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-500 block">Client IP</span>
                    <p className="font-mono text-white mt-1 truncate">{selectedOrder.clientIp}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-500 block">Tốc độ checkout</span>
                    <p className="font-mono text-white mt-1">{selectedOrder.checkoutVelocitySec}s</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                    <span className="text-[10px] text-slate-500 block">Thanh toán</span>
                    <p className="font-mono text-white mt-1">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Đóng
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(selectedOrder.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
                >
                  <Ban className="size-3.5" />
                  Hủy &amp; Khóa Tài Khoản
                </button>

                <button
                  onClick={() => handleApprove(selectedOrder.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950"
                >
                  <CheckCircle className="size-3.5" />
                  Phê Duyệt Đơn Hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
