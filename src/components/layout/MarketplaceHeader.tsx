'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  ShoppingCart,
  Shield,
  Settings,
  Sparkles,
  Flame,
  KeyRound,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useMarketplace } from '@/src/context/MarketplaceContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { useAuth } from '@/src/context/AuthContext'
import { ViewModeSwitcher } from './ViewModeSwitcher'

export function MarketplaceHeader() {
  const { cartCount, setIsCartDrawerOpen, searchQuery, setSearchQuery } = useMarketplace()
  const { viewMode, apiKey, setApiKey, modelName, setModelName, resetDatabaseToDefault, showToast } = useSecurityOrder()
  const { currentUser, logout, setIsAuthModalOpen, setAuthModalMode, setIsProfileModalOpen } = useAuth()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  const [tempModel, setTempModel] = useState(modelName)
  const [availableModelsList, setAvailableModelsList] = useState<string[]>([])
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    if (isSettingsOpen) {
      setTempKey(apiKey)
      if (modelName === 'gemini-1.5-pro' || modelName === 'gemini-1.5-flash') {
        setTempModel('gemini-2.5-flash')
      } else {
        setTempModel(modelName)
      }
      setTestState('idle')
      setTestMsg('')
    }
  }, [isSettingsOpen, apiKey, modelName])

  const handleSaveSettings = () => {
    const finalModel =
      tempModel === 'gemini-1.5-pro' || tempModel === 'gemini-1.5-flash'
        ? 'gemini-2.5-flash'
        : tempModel
    setApiKey(tempKey.trim())
    setModelName(finalModel)
    setIsSettingsOpen(false)
  }

  const handleTestKey = async () => {
    const key = tempKey.trim()
    if (!key) {
      setTestState('error')
      setTestMsg('Vui lòng nhập API Key để kiểm tra!')
      return
    }

    setTestState('testing')
    setTestMsg('Đang tra cứu danh sách mô hình từ Google AI Studio cho API Key của bạn...')

    try {
      // 1. Gọi ModelService.ListModels theo khuyến nghị chính thức của Google
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      )

      if (!listRes.ok) {
        const err = await listRes.json().catch(() => ({}))
        const msg = err.error?.message || `HTTP ${listRes.status}`
        setTestState('error')
        setTestMsg(`Lỗi xác thực API Key (${listRes.status}): ${msg}`)
        return
      }

      const listData = await listRes.json()
      const rawModels: Array<{ name: string; supportedGenerationMethods?: string[] }> =
        listData.models || []

      // Lọc các model có hỗ trợ generateContent
      const contentModels = rawModels
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))

      if (contentModels.length === 0) {
        setTestState('error')
        setTestMsg('API Key hợp lệ nhưng tài khoản chưa được kích hoạt mô hình sinh nội dung (generateContent).')
        return
      }

      setAvailableModelsList(contentModels)

      // Chọn model tốt nhất:
      // Nếu tempModel có trong danh sách -> dùng tempModel
      // Nếu không có -> chọn model ưu tiên: gemini-2.5-flash -> gemini-2.0-flash -> gemini-2.5-pro -> hoặc model đầu tiên
      let activeModel = tempModel
      if (!contentModels.includes(activeModel)) {
        activeModel =
          contentModels.find((m) => m.includes('2.5-flash')) ||
          contentModels.find((m) => m.includes('2.0-flash')) ||
          contentModels.find((m) => m.includes('flash')) ||
          contentModels.find((m) => m.includes('pro')) ||
          contentModels[0]
        setTempModel(activeModel)
        setModelName(activeModel)
      }

      // 2. Gửi thử nghiệm sinh nội dung thực tế với model đã chọn
      setTestMsg(`Đang thử nghiệm phân tích với mô hình ${activeModel}...`)
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Trả về đúng 1 chữ: PONG' }] }],
          }),
        }
      )

      if (testRes.ok) {
        setTestState('success')
        setTestMsg(
          `Kết nối Google Gemini thành công! Đã tự động kích hoạt mô hình "${activeModel}" (${contentModels.length} mô hình khả dụng).`
        )
      } else {
        const err = await testRes.json().catch(() => ({}))
        const msg = err.error?.message || `HTTP ${testRes.status}`
        setTestState('error')
        setTestMsg(`Lỗi khi gọi ${activeModel} (${testRes.status}): ${msg}`)
      }
    } catch (e: any) {
      setTestState('error')
      setTestMsg(`Lỗi kết nối mạng: ${e.message}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* Top micro banner */}
      <div className="bg-[#ee4d2d] text-white text-[11px] font-medium py-1 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Flame className="size-3 fill-amber-300 text-amber-300" />
            Siêu Sale Hàng Hiệu — Giảm Đến 50% Toàn Sàn Group 9
          </span>
          <span className="hidden md:inline opacity-75">|</span>
          <span className="hidden md:inline opacity-90">
            Hệ thống Group 9 — Bảo Mật Tầng Ứng Dụng Chuẩn AES-256-GCM &amp; Gemini AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-amber-200 hover:text-white transition font-bold"
            title="Truy cập Kênh Quản Trị Hệ Thống (/admin)"
          >
            <ShieldCheck className="size-3.5 text-amber-300" />
            <span>Kênh Quản Trị (/admin)</span>
          </Link>
          <span className="opacity-50">|</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1 hover:text-amber-200 transition"
          >
            <Settings className="size-3" />
            <span>Cài đặt AI ({apiKey ? 'Live Key' : 'Mock Rule'})</span>
          </button>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="bg-gradient-to-r from-[#ee4d2d] via-[#f05d40] to-[#e03b1b] text-white py-3 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#ee4d2d] shadow font-black text-xl">
                🛍️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-white drop-shadow">
                    Group <span className="text-amber-300">9</span>
                  </span>
                  <span className="rounded-md bg-white/20 border border-white/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                    AI XAI &amp; Crypto
                  </span>
                </div>
                <p className="text-[10px] text-orange-100 hidden sm:block">
                  Sàn TMĐT Group 9 — Phòng Chống Gian Lận &amp; Mã Hóa CSDL Đơn Hàng
                </p>
              </div>
            </div>
          </div>

          {/* Search bar (Group 9 style with quick suggestions) */}
          <div className="order-3 sm:order-2 w-full sm:w-auto flex-1 max-w-xl mx-0 sm:mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm Laptop Gaming, Bàn phím cơ, Tai nghe Bluetooth, Giày thể thao..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white py-2.5 pl-4 pr-11 text-xs text-slate-800 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-lg bg-[#ee4d2d] text-white hover:bg-[#d94124] transition shadow"
              >
                <Search className="size-4" />
              </button>
            </div>
          </div>

          {/* View Mode Switcher, User Auth & Cart */}
          <div className="order-2 sm:order-3 flex items-center gap-2.5">
            <ViewModeSwitcher />

            {/* User Account Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 rounded-xl bg-white/15 p-1 text-xs font-bold text-white border border-white/20 shadow-inner">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/20 transition active:scale-95 text-left group"
                  title="Xem & Chỉnh sửa hồ sơ cá nhân / Lịch sử đơn hàng"
                >
                  <img
                    src={
                      currentUser.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'
                    }
                    alt={currentUser.name}
                    className="size-6 rounded-full object-cover border border-white/40 ring-1 ring-white/20 shadow-sm group-hover:scale-105 transition"
                  />
                  <div className="flex flex-col">
                    <span className="hidden lg:inline max-w-[105px] truncate font-semibold group-hover:text-amber-200 transition">
                      {currentUser.name}
                    </span>
                    <span className="hidden lg:inline text-[9px] text-amber-200/80 font-normal">
                      Hồ sơ &amp; Đơn hàng
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  className="text-orange-200 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition active:scale-95"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('LOGIN')
                  setIsAuthModalOpen(true)
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-3 py-2 text-xs font-bold text-white transition shadow active:scale-95"
                title="Đăng nhập hoặc Đăng ký tài khoản Group 9"
              >
                <User className="size-4" />
                <span className="hidden md:inline">Đăng Nhập / Đăng Ký</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-3 py-2 text-xs font-bold text-white transition shadow active:scale-95"
            >
              <ShoppingCart className="size-4" />
              <span className="hidden md:inline">Giỏ Hàng</span>
              {cartCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-amber-300 text-[10px] font-black text-slate-900 font-mono shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <Settings className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cấu Hình AI Fraud Engine &amp; CSDL</h3>
                <p className="text-xs text-slate-400">
                  Google Gemini API Key và cơ chế phòng vệ mật mã
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                  <span>Google Gemini API Key</span>
                  <span className="text-emerald-400 font-normal">
                    {tempKey ? 'Đã nhập Key' : 'Mock Rule Engine (Fallback)'}
                  </span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Dán AIzaSy... vào đây"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  * Tự động lưu vào <code className="text-amber-300">localStorage</code>. Nếu không có key, hệ thống chạy cơ chế suy luận luật thông minh tự động để bảo đảm buổi bảo vệ đồ án luôn mượt mà.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Mô hình suy luận
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  {availableModelsList.length > 0 ? (
                    availableModelsList.map((m) => (
                      <option key={m} value={m}>
                        {m} {m.includes('flash') ? '(Nhanh / Khuyên dùng)' : m.includes('pro') ? '(Chuyên sâu)' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng - Nhanh, chuẩn xác &amp; mới nhất)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Phản hồi siêu tốc dưới 1s)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Phân tích suy luận chuyên sâu)</option>
                      <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Siêu nhẹ &amp; tiết kiệm tài nguyên)</option>
                    </>
                  )}
                </select>
                {availableModelsList.length > 0 && (
                  <p className="mt-1 text-[11px] text-emerald-400">
                    ✓ Đã đồng bộ {availableModelsList.length} mô hình khả dụng từ API Key của bạn.
                  </p>
                )}
              </div>

              {testState !== 'idle' && (
                <div
                  className={`rounded-xl border p-3 text-[11px] ${
                    testState === 'testing'
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      : testState === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {testState === 'testing' && <Sparkles className="size-4 animate-spin" />}
                    {testState === 'success' && <CheckCircle2 className="size-4 text-emerald-400" />}
                    {testState === 'error' && <AlertTriangle className="size-4 text-rose-400" />}
                    <span>{testMsg}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleTestKey}
                disabled={testState === 'testing'}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                {testState === 'testing' ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối Gemini API'}
              </button>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-300">Khôi phục CSDL ban đầu</p>
                  <p className="text-[11px] text-slate-500">Xóa các đơn test và nạp lại đơn mẫu</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Khôi phục dữ liệu ban đầu cho đồ án?')) {
                      resetDatabaseToDefault()
                      setIsSettingsOpen(false)
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  <RotateCcw className="size-3.5" />
                  Đặt lại
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveSettings}
                className="rounded-xl bg-[#ee4d2d] px-5 py-2 text-xs font-bold text-white hover:bg-[#d94124] shadow-md transition"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
