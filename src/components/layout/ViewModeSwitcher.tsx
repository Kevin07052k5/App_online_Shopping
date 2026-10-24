'use client'

import React from 'react'
import { ShoppingBag, ShieldCheck } from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

export function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useSecurityOrder()
  const isStore = viewMode === 'STOREFRONT'

  const handleAdminClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin'
    }
  }

  const handleStorefrontClick = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/admin') {
        window.location.href = '/'
      } else {
        setViewMode('STOREFRONT')
      }
    }
  }

  return (
    <div className="inline-flex items-center rounded-2xl bg-slate-900/90 dark:bg-slate-950 p-1 border border-slate-700 shadow-inner">
      <button
        onClick={handleStorefrontClick}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
          isStore
            ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <ShoppingBag className="size-3.5" />
        <span className="hidden sm:inline">Khách Mua Hàng</span>
        <span className="sm:hidden">Sàn</span>
      </button>

      <button
        onClick={handleAdminClick}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800"
        title="Truy cập http://localhost:3000/admin (Tài khoản: admin / admin)"
      >
        <ShieldCheck className="size-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Quản Trị An Ninh &amp; Kho (/admin)</span>
        <span className="sm:hidden">Admin</span>
      </button>
    </div>
  )
}
