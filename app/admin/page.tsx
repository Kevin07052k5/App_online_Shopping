'use client'

import React, { useState } from 'react'
import { SecurityOrderProvider, useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { MarketplaceProvider } from '@/src/context/MarketplaceContext'
import { AuthProvider, useAuth } from '@/src/context/AuthContext'
import { AdminLoginPortal } from '@/src/components/admin/AdminLoginPortal'
import { AdminSidebar, AdminTab } from '@/src/components/admin/AdminSidebar'
import { FraudDashboard } from '@/src/components/admin/FraudDashboard'
import { RiskAuditQueue } from '@/src/components/admin/RiskAuditQueue'
import { FulfillmentKanban } from '@/src/components/admin/FulfillmentKanban'
import { EncryptedDbExplorer } from '@/src/components/admin/EncryptedDbExplorer'
import { BiometricLab } from '@/src/components/admin/BiometricLab'
import { CryptoVisualizerModal } from '@/src/components/common/CryptoVisualizerModal'
import { TamperAlertModal } from '@/src/components/common/TamperAlertModal'
import { NotificationToast } from '@/src/components/common/NotificationToast'
import {
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Sparkles,
  Server,
  UserCheck,
} from 'lucide-react'

function AdminMainContent() {
  const { isAdminAuthenticated, logoutAdmin } = useAuth()
  const { toast, hideToast } = useSecurityOrder()
  const [adminTab, setAdminTab] = useState<AdminTab>('DASHBOARD')

  // If not authenticated as Admin, show login portal
  if (!isAdminAuthenticated) {
    return (
      <>
        <AdminLoginPortal />
        {toast && (
          <NotificationToast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={hideToast}
          />
        )}
      </>
    )
  }

  // Once authenticated, show full Security & Ops Hub
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      {/* Top Admin Topbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 sm:px-8 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black shadow">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">Group 9</span>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  Security Admin Hub
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Hệ Thống Kiểm Toán Gian Lận &amp; Kho Vận Tự Động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Admin identity badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 font-mono">
              <UserCheck className="size-3.5 text-emerald-400" />
              <span>admin</span>
            </div>

            {/* Back to Storefront Link */}
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Quay về gian hàng"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden md:inline">Về Cửa Hàng</span>
            </a>

            {/* Logout Admin */}
            <button
              onClick={logoutAdmin}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition"
              title="Đăng xuất khỏi hệ thống quản trị"
            >
              <LogOut className="size-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Operations Body */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 w-full">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Admin Navigation */}
          <AdminSidebar currentTab={adminTab} onSelectTab={setAdminTab} />

          {/* Active Tab View */}
          {adminTab === 'DASHBOARD' && (
            <FraudDashboard onGoToQueue={() => setAdminTab('RISK_QUEUE')} />
          )}
          {adminTab === 'RISK_QUEUE' && <RiskAuditQueue />}
          {adminTab === 'FULFILLMENT' && <FulfillmentKanban />}
          {adminTab === 'DATABASE' && <EncryptedDbExplorer />}
          {adminTab === 'BIOMETRIC_LAB' && <BiometricLab />}
        </div>
      </main>

      {/* Security Modals & Alerts */}
      <CryptoVisualizerModal />
      <TamperAlertModal />

      {/* Global Notifications */}
      {toast && (
        <NotificationToast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={hideToast}
        />
      )}

      {/* Admin Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-4 text-center text-[11px] text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Group 9 Security Hub — Cổng Quản Trị An Ninh &amp; Kho Vận</span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>AES-256-GCM Verified</span>
            <span>•</span>
            <span>HMAC-SHA256 Blind Index</span>
            <span>•</span>
            <span>Gemini 1.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <SecurityOrderProvider>
        <MarketplaceProvider>
          <AdminMainContent />
        </MarketplaceProvider>
      </SecurityOrderProvider>
    </AuthProvider>
  )
}
