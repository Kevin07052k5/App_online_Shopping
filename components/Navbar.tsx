'use client'

import {
  Shield,
  ShoppingBag,
  Settings,
  Leaf,
  Layers,
  Sparkles,
  Lock,
  Cpu,
} from 'lucide-react'

interface NavbarProps {
  currentView: 'storefront' | 'admin'
  onSwitchView: (view: 'storefront' | 'admin') => void
  cartCount: number
  onOpenCart?: () => void
  onOpenSettings: () => void
  apiKeyConfigured: boolean
}

export function Navbar({
  currentView,
  onSwitchView,
  cartCount,
  onOpenCart,
  onOpenSettings,
  apiKeyConfigured,
}: NavbarProps) {
  const isStore = currentView === 'storefront'

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        isStore
          ? 'border-emerald-100 bg-white/95 text-slate-800 backdrop-blur shadow-sm'
          : 'border-slate-800 bg-slate-950/95 text-slate-100 backdrop-blur shadow-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSwitchView('storefront')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div
              className={`flex size-10 items-center justify-center rounded-2xl shadow transition ${
                isStore
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-emerald-700/20'
                  : 'bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-cyan-950'
              }`}
            >
              <Leaf className="size-5 transition group-hover:rotate-12" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-lg font-black tracking-tight ${
                    isStore ? 'text-emerald-800' : 'text-white'
                  }`}
                >
                  HTP <span className="text-emerald-500">FOODY</span>
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    isStore
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  AI Security
                </span>
              </div>
              <p
                className={`text-[10px] hidden sm:block ${
                  isStore ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Trái cây tươi — Vì sức khoẻ người tiêu dùng
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher (Core Requirement: 2 Chế độ xem) */}
        <div className="flex items-center rounded-2xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onSwitchView('storefront')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              isStore
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="size-3.5" />
            <span className="hidden sm:inline">Khách Hàng (Storefront)</span>
            <span className="sm:hidden">Cửa Hàng</span>
          </button>

          <button
            onClick={() => onSwitchView('admin')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              !isStore
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="size-3.5" />
            <span className="hidden sm:inline">Quản Trị (Security Hub)</span>
            <span className="sm:hidden">Quản Trị</span>
          </button>
        </div>

        {/* Right Action Icons: Cart & Settings */}
        <div className="flex items-center gap-2">
          {isStore && onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <ShoppingBag className="size-4 text-emerald-700" />
              <span className="hidden sm:inline">Giỏ Hàng</span>
              {cartCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-emerald-700 text-[10px] font-bold text-white font-mono">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition ${
              isStore
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
            title="Cài đặt Gemini API & Bảo mật"
          >
            <Settings className="size-4" />
            <span className="hidden md:inline text-[11px]">
              {apiKeyConfigured ? 'Gemini: Đã kết nối' : 'Cấu hình API Key'}
            </span>
            <span
              className={`size-2 rounded-full ${
                apiKeyConfigured ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  )
}
