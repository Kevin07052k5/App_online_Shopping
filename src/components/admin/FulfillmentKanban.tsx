'use client'

import React, { useState } from 'react'
import {
  Truck,
  Box,
  CheckCircle,
  ArrowRight,
  Package,
  Layers,
  MapPin,
} from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { FulfillmentStatus } from '@/src/types/order'
import { formatVND } from '@/src/utils/helpers'

export function FulfillmentKanban() {
  const { orders, updateFulfillmentStatus } = useSecurityOrder()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleNextStatus = (orderId: string, currentStatus: FulfillmentStatus, orderCode: string) => {
    let nextStatus: FulfillmentStatus = currentStatus
    let statusText = ''

    if (currentStatus === 'PAID_APPROVED') {
      nextStatus = 'PACKAGING'
      statusText = 'Người bán đang đóng gói (bọc chống sốc, niêm phong)'
    } else if (currentStatus === 'PACKAGING') {
      nextStatus = 'IN_TRANSIT'
      statusText = 'Bàn giao cho đơn vị vận chuyển SPX Express'
    } else if (currentStatus === 'IN_TRANSIT') {
      nextStatus = 'DELIVERED'
      statusText = 'Giao hàng thành công cho khách'
    }

    if (nextStatus !== currentStatus) {
      updateFulfillmentStatus(orderId, nextStatus)
      showToast(`Đơn hàng ${orderCode}: ${statusText}`)
    }
  }

  const colApproved = orders.filter((o) => o.fulfillmentStatus === 'PAID_APPROVED')
  const colPackaging = orders.filter((o) => o.fulfillmentStatus === 'PACKAGING')
  const colInTransit = orders.filter((o) => o.fulfillmentStatus === 'IN_TRANSIT')
  const colDelivered = orders.filter((o) => o.fulfillmentStatus === 'DELIVERED')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="size-5 text-blue-400" />
            <span>Vòng Đời Vận Chuyển 4 Bước Chuẩn Sàn TMĐT</span>
          </h3>
          <p className="text-xs text-slate-400">
            Quy trình vận hành: Đã duyệt &rarr; Đóng gói chống sốc &rarr; Đang giao SPX Express &rarr; Giao thành công
          </p>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-3 text-xs font-bold text-emerald-300 shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4-column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Đã duyệt thanh toán */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <h4 className="font-bold text-xs text-white">1. Đã duyệt thanh toán</h4>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
              {colApproved.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px]">
            {colApproved.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
            ) : (
              colApproved.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                    <span className="font-bold text-amber-300">{formatVND(ord.finalTotalAmount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                  <button
                    onClick={() => handleNextStatus(ord.id, ord.fulfillmentStatus, ord.orderCode)}
                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition"
                  >
                    <span>Chuyển đóng gói</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Người bán đang đóng gói */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-400" />
              <h4 className="font-bold text-xs text-white">2. Đang đóng gói</h4>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
              {colPackaging.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px]">
            {colPackaging.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
            ) : (
              colPackaging.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                    <span className="font-bold text-amber-300">{formatVND(ord.finalTotalAmount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                  <div className="text-[10px] text-amber-400">📦 Kiểm kho &amp; bọc chống sốc niêm phong</div>
                  <button
                    onClick={() => handleNextStatus(ord.id, ord.fulfillmentStatus, ord.orderCode)}
                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-amber-600/20 border border-amber-500/40 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-600/30 transition"
                  >
                    <span>Bàn giao Shipper</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Đang vận chuyển */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-400" />
              <h4 className="font-bold text-xs text-white">3. Đang vận chuyển</h4>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
              {colInTransit.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px]">
            {colInTransit.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
            ) : (
              colInTransit.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                    <span className="font-bold text-amber-300">{formatVND(ord.finalTotalAmount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                  <div className="text-[10px] text-blue-400">🛵 Đang giao qua SPX Express / J&amp;T</div>
                  <button
                    onClick={() => handleNextStatus(ord.id, ord.fulfillmentStatus, ord.orderCode)}
                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 transition"
                  >
                    <span>Giao thành công</span>
                    <CheckCircle className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Giao hàng thành công */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <h4 className="font-bold text-xs text-white">4. Giao hàng thành công</h4>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
              {colDelivered.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px]">
            {colDelivered.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
            ) : (
              colDelivered.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-emerald-900/50 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                    <span className="font-bold text-emerald-400">{formatVND(ord.finalTotalAmount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle className="size-3" /> Khách đã nhận &amp; hoàn tất đối soát
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
