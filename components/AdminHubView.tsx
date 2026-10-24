'use client'

import { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  PackageCheck,
  Lock,
  Unlock,
  Search,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Flame,
  FileCheck,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Database,
  Terminal,
  Activity,
  Layers,
  Truck,
  Box,
  Fingerprint,
  FileKey,
  ShieldX,
} from 'lucide-react'
import {
  EncryptedOrderRecord,
  OrderFulfillmentStatus,
  SecurityAlert,
} from '@/lib/types'
import { computeBlindIndex, verifyRecordIntegrity } from '@/lib/crypto-service'

interface AdminHubViewProps {
  orders: EncryptedOrderRecord[]
  alerts: SecurityAlert[]
  onOpenXaiModal: (order: EncryptedOrderRecord) => void
  onUpdateOrderStatus: (orderId: string, newStatus: OrderFulfillmentStatus) => void
  onSimulateTamper: (orderId: string) => void
  onRestoreTampered: (orderId: string) => void
  onTriggerIntegrityCheck: (orderId: string) => void
  onOpenSettings: () => void
}

export function AdminHubView({
  orders,
  alerts,
  onOpenXaiModal,
  onUpdateOrderStatus,
  onSimulateTamper,
  onRestoreTampered,
  onTriggerIntegrityCheck,
  onOpenSettings,
}: AdminHubViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'fulfillment' | 'database'>('overview')

  // Search by phone via Blind Index in Tab 4
  const [searchPhone, setSearchPhone] = useState('')
  const [computedSearchBlindIndex, setComputedSearchBlindIndex] = useState('')
  const [isSearchingBlindIndex, setIsSearchingBlindIndex] = useState(false)
  const [blindIndexMatchedId, setBlindIndexMatchedId] = useState<string | null>(null)

  // Authorized Decrypt Toggle in Tab 4
  const [isAuthorizedDecrypted, setIsAuthorizedDecrypted] = useState(false)

  // Calculations for Tab 1 Overview
  const totalOrdersCount = orders.length
  const totalRevenue = orders
    .filter((o) => o.status !== 'REJECTED' && o.status !== 'HOLD_REVIEW')
    .reduce((sum, o) => sum + o.total_amount, 0)

  const safeOrdersCount = orders.filter((o) => o.ai_analysis.riskLevel === 'LOW').length
  const safeRate = totalOrdersCount > 0 ? Math.round((safeOrdersCount / totalOrdersCount) * 100) : 100

  const highRiskCount = orders.filter((o) => o.ai_analysis.riskLevel === 'HIGH').length
  const blockedRate = totalOrdersCount > 0 ? Math.round((highRiskCount / totalOrdersCount) * 100) : 0

  // Risk Score Distribution (Low: 0-30, Medium: 31-70, High: 71-100)
  const distLow = orders.filter((o) => o.ai_analysis.riskScore <= 30).length
  const distMed = orders.filter((o) => o.ai_analysis.riskScore > 30 && o.ai_analysis.riskScore <= 70).length
  const distHigh = orders.filter((o) => o.ai_analysis.riskScore > 70).length

  // Tab 2: Queue orders (Medium & High risk, or status HOLD_REVIEW)
  const queueOrders = orders.filter(
    (o) => o.ai_analysis.riskLevel !== 'LOW' || o.status === 'HOLD_REVIEW'
  )

  // Tab 3: Fulfillment Kanban columns
  const approvedCol = orders.filter((o) => o.status === 'APPROVED')
  const packagingCol = orders.filter((o) => o.status === 'PACKAGING')
  const inTransitCol = orders.filter((o) => o.status === 'IN_TRANSIT')
  const deliveredCol = orders.filter((o) => o.status === 'DELIVERED')

  // Handle Blind Index Search
  const handleBlindIndexSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchPhone.trim()) {
      setComputedSearchBlindIndex('')
      setBlindIndexMatchedId(null)
      return
    }

    setIsSearchingBlindIndex(true)
    try {
      const bIndex = await computeBlindIndex(searchPhone.trim())
      setComputedSearchBlindIndex(bIndex)

      // Query database where phone_blind_index == computed HMAC
      const match = orders.find((o) => o.phone_blind_index.toLowerCase() === bIndex.toLowerCase())
      setBlindIndexMatchedId(match ? match.id : 'NOT_FOUND')
    } catch (err) {
      console.error('Blind index search failed:', err)
    } finally {
      setIsSearchingBlindIndex(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-16">
      {/* Top Operations Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  HTP FOODY OPS &amp; SECURITY HUB
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Shield Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hệ thống Giám sát Gian lận AI &amp; Mật mã hóa Tầng Ứng dụng CSDL
              </p>
            </div>
          </div>

          {/* 4 Dashboard Tabs */}
          <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="size-3.5" />
              <span>1. Tổng Quan</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition relative ${
                activeTab === 'queue'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="size-3.5" />
              <span>2. Hàng Đợi Rủi Ro AI</span>
              {queueOrders.length > 0 && (
                <span className="grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-mono font-bold text-white">
                  {queueOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fulfillment')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'fulfillment'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="size-3.5" />
              <span>3. Vòng Đời Vận Chuyển</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'database'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="size-3.5" />
              <span>4. CSDL Mã Hóa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Tab Views */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================================================= */}
        {/* TAB 1: THỐNG KÊ & TỔNG QUAN (SECURITY & BUSINESS OVERVIEW)               */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Tổng Đơn Hàng</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <PackageCheck className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{totalOrdersCount}</span>
                  <span className="text-xs text-blue-400 font-semibold">Giao dịch</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Đã ghi nhận vào CSDL mã hóa</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Doanh Thu Hợp Lệ</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {totalRevenue.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Các đơn đã duyệt &amp; đang giao</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Tỷ Lệ Đơn An Toàn</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{safeRate}%</span>
                  <span className="text-xs text-emerald-500 font-semibold">Độ tin cậy cao</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Điểm rủi ro AI &lt; 30/100</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Tỷ Lệ Chặn Rủi Ro</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                    <ShieldAlert className="size-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-400">{blockedRate}%</span>
                  <span className="text-xs text-rose-400 font-semibold">{highRiskCount} vụ chặn</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Ngăn chặn thử thẻ &amp; botnet spam</p>
              </div>
            </div>

            {/* Risk Score Distribution & Live Security Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Distribution Chart (SVG Visual) */}
              <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Phân Bố Điểm Rủi Ro AI (Risk Score Distribution)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Đo lường phân tích tự động từ mô hình Gemini XAI
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-mono text-slate-300">
                    N = {totalOrdersCount} mẫu
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Low Risk Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Rủi ro Thấp (0 - 30 điểm): Tự động Thông qua
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {distLow} đơn ({totalOrdersCount > 0 ? Math.round((distLow / totalOrdersCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${totalOrdersCount > 0 ? (distLow / totalOrdersCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium Risk Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-500" />
                        Rủi ro Trung bình (31 - 70 điểm): Thách thức OTP / Kiểm duyệt
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {distMed} đơn ({totalOrdersCount > 0 ? Math.round((distMed / totalOrdersCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${totalOrdersCount > 0 ? (distMed / totalOrdersCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* High Risk Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-rose-500" />
                        Rủi ro Cao (71 - 100 điểm): Tạm giữ Cách ly (Card fraud / Bot)
                      </span>
                      <span className="font-mono text-slate-300 font-bold">
                        {distHigh} đơn ({totalOrdersCount > 0 ? Math.round((distHigh / totalOrdersCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${totalOrdersCount > 0 ? (distHigh / totalOrdersCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 flex items-center justify-between">
                  <span>Mô hình suy luận hiện tại:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    Google Gemini 1.5 Flash (Kèm Mock Inference Fallback)
                  </span>
                </div>
              </div>

              {/* Real-Time Security Alerts Feed */}
              <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Flame className="size-4 text-amber-400" />
                      Cảnh Báo An Ninh Tức Thời (SOC Feed)
                    </h3>
                    <span className="text-[10px] text-slate-500">Thời gian thực</span>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {alerts.map((al) => (
                      <div
                        key={al.id}
                        className={`rounded-2xl border p-3 text-xs transition ${
                          al.type === 'DANGER'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                            : al.type === 'WARNING'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                            : al.type === 'CRYPTO'
                            ? 'border-purple-500/30 bg-purple-500/10 text-purple-200'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                          <span>{al.title}</span>
                          <span className="font-mono text-[10px] opacity-75">{al.timestamp}</span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed">{al.description}</p>
                        {al.orderCode && (
                          <div className="mt-1 font-mono text-[10px] opacity-70">
                            Mã đơn: {al.orderCode}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Trạng thái bảo vệ: Toàn diện</span>
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    Xem hàng đợi <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: HÀNG ĐỢI PHÊ DUYỆT RỦI RO AI (RISK REVIEW QUEUE)                   */}
        {/* ========================================================================= */}
        {activeTab === 'queue' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="size-5 text-amber-400" />
                  Hàng Đợi Kiểm Duyệt Rủi Ro AI (Explainable AI Queue)
                </h3>
                <p className="text-xs text-slate-400">
                  Các đơn hàng có điểm rủi ro MEDIUM hoặc HIGH do Gemini phát hiện cần nhân viên bảo mật thẩm định
                </p>
              </div>
              <span className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-300">
                {queueOrders.length} Đơn Cần Xem Xét
              </span>
            </div>

            {queueOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
                <CheckCircle className="size-10 text-emerald-400 mx-auto mb-3" />
                <h4 className="font-bold text-white text-sm">Hàng đợi rủi ro hiện đang trống!</h4>
                <p className="text-xs mt-1">
                  Mọi đơn hàng đều ở trạng thái an toàn hoặc đã được phê duyệt.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {queueOrders.map((ord) => {
                  const isHigh = ord.ai_analysis.riskLevel === 'HIGH'
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
                            Điểm rủi ro: {ord.ai_analysis.riskScore}/100 ({ord.ai_analysis.riskLevel})
                          </span>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                            {ord.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                          {ord.items_summary} —{' '}
                          <strong className="text-amber-300 font-mono">
                            {ord.total_amount.toLocaleString('vi-VN')}₫
                          </strong>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>Client IP: <strong className="text-slate-300 font-mono">{ord.client_ip} ({ord.ip_country})</strong></span>
                          <span>Thời gian giỏ: <strong className="text-slate-300">{ord.cart_duration_seconds}s</strong></span>
                          <span>Phương thức: <strong className="text-slate-300">{ord.payment_method}</strong></span>
                        </div>

                        {/* Top XAI reason snippet */}
                        <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 rounded-xl p-2 border border-rose-500/20">
                          <span className="font-bold">Lý do Gemini XAI:</span> {ord.ai_analysis.reasons[0]}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => onOpenXaiModal(ord)}
                          className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition"
                        >
                          <Eye className="size-3.5" />
                          Xem XAI Chi Tiết
                        </button>

                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'APPROVED')}
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-950"
                        >
                          Chấp Thuận Đơn
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VÒNG ĐỜI ĐÓNG GÓI & VẬN CHUYỂN (FULFILLMENT PIPELINE)             */}
        {/* ========================================================================= */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="size-5 text-blue-400" />
                  Vòng Đời Đóng Gói &amp; Vận Chuyển (Fulfillment Pipeline)
                </h3>
                <p className="text-xs text-slate-400">
                  Quản lý 4 bước vận hành: Đã duyệt &rarr; Đóng gói thùng xốp &rarr; Đang giao &rarr; Hoàn tất
                </p>
              </div>
            </div>

            {/* 4-column Kanban Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cột 1: Đã duyệt (Approved) */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-400" />
                    <h4 className="font-bold text-xs text-white">1. Đã duyệt (Approved)</h4>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    {approvedCol.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {approvedCol.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
                  ) : (
                    approvedCol.map((ord) => (
                      <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                          <span className="font-bold text-amber-300">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{ord.items_summary}</p>
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'PACKAGING')}
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

              {/* Cột 2: Đang đóng gói (Packaging) */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-400" />
                    <h4 className="font-bold text-xs text-white">2. Đang đóng gói (Packaging)</h4>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    {packagingCol.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {packagingCol.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
                  ) : (
                    packagingCol.map((ord) => (
                      <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                          <span className="font-bold text-amber-300">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{ord.items_summary}</p>
                        <div className="text-[10px] text-amber-400">📦 Đang đóng thùng xốp bảo quản mát</div>
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'IN_TRANSIT')}
                          className="w-full flex items-center justify-center gap-1 rounded-xl bg-amber-600/20 border border-amber-500/40 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-600/30 transition"
                        >
                          <span>Giao cho Shipper</span>
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cột 3: Đang giao hàng (In Transit) */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-blue-400" />
                    <h4 className="font-bold text-xs text-white">3. Đang giao hàng (In Transit)</h4>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    {inTransitCol.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {inTransitCol.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
                  ) : (
                    inTransitCol.map((ord) => (
                      <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                          <span className="font-bold text-amber-300">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{ord.items_summary}</p>
                        <div className="text-[10px] text-blue-400">🛵 Shipper hỏa tốc nội thành 2h</div>
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'DELIVERED')}
                          className="w-full flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500 transition"
                        >
                          <span>Xác nhận giao thành công</span>
                          <CheckCircle className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cột 4: Hoàn tất (Delivered) */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-xs text-white">4. Hoàn tất (Delivered)</h4>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    {deliveredCol.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {deliveredCol.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Không có đơn hàng</div>
                  ) : (
                    deliveredCol.map((ord) => (
                      <div key={ord.id} className="rounded-2xl border border-emerald-900/50 bg-slate-950 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-white">{ord.orderCode}</span>
                          <span className="font-bold text-emerald-400">{ord.total_amount.toLocaleString('vi-VN')}₫</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{ord.items_summary}</p>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <CheckCircle className="size-3" /> Khách đã nhận &amp; đối soát xong
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CSDL MÃ HÓA & KIỂM TRA TOÀN VẸN (ENCRYPTED DB EXPLORER)             */}
        {/* ========================================================================= */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="size-5 text-purple-400" />
                  CSDL Mã Hóa &amp; Kiểm Tra Toàn Vẹn (Encrypted DB Explorer)
                </h3>
                <p className="text-xs text-slate-400">
                  Dữ liệu PII lưu dạng AES-256-GCM Hex, hỗ trợ tìm kiếm qua Blind Index (HMAC-SHA256) và kiểm tra Checksum SHA-256
                </p>
              </div>

              {/* Authorized Decrypt Toggle Button */}
              <button
                onClick={() => setIsAuthorizedDecrypted(!isAuthorizedDecrypted)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-md ${
                  isAuthorizedDecrypted
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isAuthorizedDecrypted ? (
                  <>
                    <EyeOff className="size-4" />
                    <span>Ẩn Bản Rõ (Khóa Lại)</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    <span>👁️ Giải Mã Hợp Lệ (Authorized Decrypt)</span>
                  </>
                )}
              </button>
            </div>

            {/* Blind Index Search Bar */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Fingerprint className="size-4" />
                  Mô phỏng Tra Cứu Số Điện Thoại Bằng Blind Index (HMAC-SHA256):
                </span>
                <span className="text-[11px] text-slate-400">
                  Tìm kiếm chính xác mà KHÔNG CẦN giải mã cơ sở dữ liệu!
                </span>
              </div>

              <form onSubmit={handleBlindIndexSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nhập SĐT để test Blind Index (VD: 0908123456, 0912345678, 0988888888)..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingBlindIndex}
                  className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
                >
                  {isSearchingBlindIndex ? 'Đang băm HMAC...' : 'Băm & Tra Cứu Blind Index'}
                </button>
              </form>

              {computedSearchBlindIndex && (
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Chuỗi HMAC-SHA256 Blind Index tính toán trực tiếp:</span>
                    {blindIndexMatchedId === 'NOT_FOUND' ? (
                      <span className="text-rose-400 font-bold">Không tìm thấy bản ghi nào khớp!</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Đã tìm thấy bản ghi khớp hoàn toàn!</span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-emerald-300 break-all bg-slate-900 p-2 rounded-xl">
                    {computedSearchBlindIndex}
                  </p>
                </div>
              )}
            </div>

            {/* Database Records Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4">Mã Đơn / ID</th>
                      <th className="py-3.5 px-4">Tên (enc_name)</th>
                      <th className="py-3.5 px-4">SĐT (enc_phone) &amp; Blind Index</th>
                      <th className="py-3.5 px-4">Địa Chỉ (enc_addr)</th>
                      <th className="py-3.5 px-4">Mã Checksum (SHA-256)</th>
                      <th className="py-3.5 px-4">Trạng Thái Toàn Vẹn</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác Bảo Mật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {orders.map((ord) => {
                      const isMatched = blindIndexMatchedId === ord.id
                      const isTampered = ord.isTampered

                      return (
                        <tr
                          key={ord.id}
                          className={`transition ${
                            isTampered
                              ? 'bg-rose-950/30 text-rose-200'
                              : isMatched
                              ? 'bg-emerald-950/40 text-emerald-200'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Mã đơn */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{ord.orderCode}</span>
                            <span className="text-[10px] text-slate-500 font-sans">{ord.createdAt.slice(11)}</span>
                          </td>

                          {/* Tên */}
                          <td className="py-3.5 px-4">
                            {isAuthorizedDecrypted ? (
                              <span className="text-emerald-400 font-sans font-bold">
                                {ord.decryptedData?.customer_name || 'Nguyễn Văn An'}
                              </span>
                            ) : (
                              <div title={ord.enc_name.ciphertextHex}>
                                <span className="text-purple-300 block truncate max-w-[140px]">
                                  {ord.enc_name.ciphertextHex}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                                  Tag: {ord.enc_name.tagHex.slice(0, 12)}...
                                </span>
                              </div>
                            )}
                          </td>

                          {/* SĐT & Blind Index */}
                          <td className="py-3.5 px-4">
                            {isAuthorizedDecrypted ? (
                              <span className="text-emerald-400 font-bold block">
                                {ord.decryptedData?.phone || '0908123456'}
                              </span>
                            ) : (
                              <div>
                                <span className="text-purple-300 block truncate max-w-[140px]">
                                  {ord.enc_phone.ciphertextHex}
                                </span>
                                <span className="text-[10px] text-emerald-400/90 block truncate max-w-[140px]" title={ord.phone_blind_index}>
                                  BIndex: {ord.phone_blind_index.slice(0, 14)}...
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Địa chỉ */}
                          <td className="py-3.5 px-4 max-w-[200px]">
                            {isAuthorizedDecrypted ? (
                              <span className="text-slate-200 font-sans block truncate" title={ord.decryptedData?.shipping_address}>
                                {ord.decryptedData?.shipping_address}
                              </span>
                            ) : (
                              <div>
                                <span
                                  className={`block truncate ${
                                    isTampered ? 'text-rose-400 font-bold underline' : 'text-purple-300'
                                  }`}
                                  title={ord.enc_addr.ciphertextHex}
                                >
                                  {ord.enc_addr.ciphertextHex}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  IV: {ord.enc_addr.ivHex.slice(0, 10)}...
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Checksum */}
                          <td className="py-3.5 px-4">
                            <span className="text-cyan-300 block truncate max-w-[140px]" title={ord.record_checksum}>
                              {ord.record_checksum.slice(0, 18)}...
                            </span>
                          </td>

                          {/* Trạng thái toàn vẹn */}
                          <td className="py-3.5 px-4 font-sans">
                            {isTampered ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/50 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                                <ShieldX className="size-3" />
                                ĐÃ BỊ SỬA ĐỔI!
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                <ShieldCheck className="size-3" />
                                Hợp lệ (Valid)
                              </span>
                            )}
                          </td>

                          {/* Thao tác mô phỏng tấn công & kiểm tra */}
                          <td className="py-3.5 px-4 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {isTampered ? (
                                <button
                                  onClick={() => onRestoreTampered(ord.id)}
                                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                                >
                                  Khôi phục
                                </button>
                              ) : (
                                <button
                                  onClick={() => onSimulateTamper(ord.id)}
                                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/20 transition"
                                  title="Mô phỏng hacker sửa đổi 1 byte trong CSDL"
                                >
                                  ⚠️ Sửa 1 Byte
                                </button>
                              )}

                              <button
                                onClick={() => onTriggerIntegrityCheck(ord.id)}
                                className="rounded-xl bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-slate-700 transition"
                                title="Kiểm tra chữ ký Checksum SHA-256 và thẻ GMAC"
                              >
                                🛡️ Kiểm Tra
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
