'use client'

import React from 'react'
import {
  TrendingUp,
  ShieldAlert,
  Truck,
  Database,
  Shield,
  Layers,
  Activity,
  Cpu,
  Scan,
} from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

export type AdminTab = 'DASHBOARD' | 'RISK_QUEUE' | 'FULFILLMENT' | 'DATABASE' | 'BIOMETRIC_LAB'

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
}

export function AdminSidebar({ currentTab, onSelectTab }: AdminSidebarProps) {
  const { orders } = useSecurityOrder()

  const pendingRiskCount = orders.filter(
    (o) => o.aiExplanation.riskLevel !== 'LOW' || o.fulfillmentStatus === 'HOLD_REVIEW'
  ).length

  const navItems = [
    {
      id: 'DASHBOARD' as AdminTab,
      label: '1. Chỉ Số Gian Lận & Tổng Quan',
      shortLabel: 'Tổng quan',
      icon: TrendingUp,
      badge: null,
      color: 'text-emerald-400',
    },
    {
      id: 'RISK_QUEUE' as AdminTab,
      label: '2. Hàng Đợi Kiểm Duyệt Rủi Ro AI',
      shortLabel: 'Hàng đợi XAI',
      icon: ShieldAlert,
      badge: pendingRiskCount > 0 ? pendingRiskCount : null,
      color: 'text-amber-400',
    },
    {
      id: 'FULFILLMENT' as AdminTab,
      label: '3. Vòng Đời Đóng Gói & Vận Chuyển',
      shortLabel: 'Vận chuyển',
      icon: Truck,
      badge: null,
      color: 'text-blue-400',
    },
    {
      id: 'DATABASE' as AdminTab,
      label: '4. CSDL Mã Hóa & Blind Index Lab',
      shortLabel: 'CSDL Mã hóa',
      icon: Database,
      badge: null,
      color: 'text-purple-400',
    },
    {
      id: 'BIOMETRIC_LAB' as AdminTab,
      label: '5. Lớp Bảo Vệ Sinh Trắc Học & Anti-Spoofing',
      shortLabel: 'SFace Lab',
      icon: Scan,
      badge: '128D',
      color: 'text-cyan-400',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-lg shadow-emerald-950/40'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 ' + item.color
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold truncate text-white">
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Phân hệ nghiệp vụ {item.id}
                  </span>
                </div>
              </div>

              {item.badge !== null && (
                <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-black text-white font-mono shadow ml-1 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
