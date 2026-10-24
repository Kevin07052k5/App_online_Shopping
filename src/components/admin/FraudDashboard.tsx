'use client'

import React from 'react'
import {
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  PackageCheck,
  Flame,
  Ticket,
  Bot,
  Cpu,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { formatVND } from '@/src/utils/helpers'

interface FraudDashboardProps {
  onGoToQueue: () => void
}

export function FraudDashboard({ onGoToQueue }: FraudDashboardProps) {
  const { orders, apiKey, modelName } = useSecurityOrder()

  const totalOrders = orders.length
  const totalRevenue = orders
    .filter((o) => o.fulfillmentStatus !== 'CANCELLED' && o.fulfillmentStatus !== 'HOLD_REVIEW')
    .reduce((sum, o) => sum + o.finalTotalAmount, 0)

  const highRiskCount = orders.filter((o) => o.aiExplanation.riskLevel === 'HIGH').length
  const blockedRate = totalOrders > 0 ? Math.round((highRiskCount / totalOrders) * 100) : 0

  // Total discount saved from blocked/hold orders
  const savedVoucherBudget = orders
    .filter((o) => o.fulfillmentStatus === 'HOLD_REVIEW' || o.fulfillmentStatus === 'CANCELLED')
    .reduce((sum, o) => sum + o.discountAmount, 0)

  // Risk Distribution
  const lowCount = orders.filter((o) => o.aiExplanation.riskScore <= 30).length
  const medCount = orders.filter((o) => o.aiExplanation.riskScore > 30 && o.aiExplanation.riskScore <= 70).length
  const highCount = orders.filter((o) => o.aiExplanation.riskScore > 70).length

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Đơn Hàng */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tổng Đơn Hàng Sàn</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <PackageCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalOrders}</span>
            <span className="text-xs text-blue-400 font-semibold">Giao dịch</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Đã lưu trữ bảo vệ trong CSDL mã hóa</p>
        </div>

        {/* Card 2: Doanh Thu Hợp Lệ */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Doanh Thu Hợp Lệ</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatVND(totalRevenue)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Đơn hàng hợp lệ đã thanh toán &amp; đang giao</p>
        </div>

        {/* Card 3: Tỷ Lệ Đơn Gian Lận Bị Chặn */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tỷ Lệ Chặn Gian Lận AI</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">{blockedRate}%</span>
            <span className="text-xs text-rose-400 font-semibold">{highRiskCount} vụ cách ly</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Chặn thử thẻ (Card testing) &amp; botnet spam</p>
        </div>

        {/* Card 4: Tiết Kiệm Ngân Sách Voucher */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tiết Kiệm Ngân Sách Voucher</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Ticket className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {formatVND(savedVoucherBudget)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Ngăn kẻ gian trục lợi mã lỗi 90%</p>
        </div>
      </div>

      {/* Distribution & Realtime alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">
                Phân Bố Điểm Rủi Ro Đơn Hàng (Risk Score Distribution)
              </h3>
              <p className="text-xs text-slate-400">
                Đánh giá theo thời gian thực từ Google Gemini AI &amp; Heuristic Rules
              </p>
            </div>
            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-mono text-slate-300">
              N = {totalOrders} giao dịch
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Low Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Rủi ro Thấp (0 - 30 điểm): Tự động Phê duyệt
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {lowCount} đơn ({totalOrders > 0 ? Math.round((lowCount / totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalOrders > 0 ? (lowCount / totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-400" />
                  Rủi ro Trung bình (31 - 70 điểm): Thách thức OTP qua SMS
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {medCount} đơn ({totalOrders > 0 ? Math.round((medCount / totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalOrders > 0 ? (medCount / totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* High Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-400" />
                  Rủi ro Cao (71 - 100 điểm): Tạm giữ Cách ly Hàng đợi An ninh
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {highCount} đơn ({totalOrders > 0 ? Math.round((highCount / totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalOrders > 0 ? (highCount / totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs flex items-center justify-between">
            <span className="text-slate-400">Trạng thái động cơ AI Fraud Detection:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              {apiKey ? `Gemini Live: ${modelName}` : 'Heuristic Rules Engine (Active Fallback)'}
            </span>
          </div>
        </div>

        {/* Real-time Threat Stream */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Flame className="size-4 text-amber-400" />
                Nhật Ký Cảnh Báo An Ninh Sàn (SOC Stream)
              </h3>
              <span className="text-[10px] text-slate-500">Live Telemetry</span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200">
                <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                  <span>Phát hiện Botnet Trục Lợi Voucher 90%</span>
                  <span className="font-mono text-[10px] opacity-75">17:10:08</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Chặn đơn hàng 49.980.000₫ từ IP Proxy Hà Lan, User-Agent Headless Chrome.
                </p>
                <div className="mt-1 font-mono text-[10px] opacity-70">Mã đơn: ORD-2026-HACK99</div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-purple-200">
                <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                  <span>Mã Hóa AES-256-GCM &amp; Băm Blind Index</span>
                  <span className="font-mono text-[10px] opacity-75">16:40:12</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Niêm phong dữ liệu PII và lưu trữ an toàn trong CSDL cho đơn ORD-2026-VN303.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
                <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                  <span>Giao Dịch Thẻ Tín Dụng Xác Thực Thành Công</span>
                  <span className="font-mono text-[10px] opacity-75">15:20:48</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Khách hàng hoàn tất nhập mã OTP 2 yếu tố. Đơn chuyển vào bước Đóng gói.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Hàng đợi rủi ro: {highRiskCount} đơn</span>
            <button
              onClick={onGoToQueue}
              className="text-amber-400 hover:underline font-bold flex items-center gap-1"
            >
              Xem hàng đợi kiểm duyệt <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
