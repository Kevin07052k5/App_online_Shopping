'use client'

import React, { useState } from 'react'
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext'
import { SecurityOrderProvider, useSecurityOrder } from './context/SecurityOrderContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminLoginPortal } from './components/admin/AdminLoginPortal'
import { MarketplaceHeader } from './components/layout/MarketplaceHeader'
import { BannerCarousel } from './components/storefront/BannerCarousel'
import { CategoryGrid } from './components/storefront/CategoryGrid'
import { ProductCard } from './components/storefront/ProductCard'
import { CartDrawer } from './components/storefront/CartDrawer'
import { CheckoutModal } from './components/storefront/CheckoutModal'
import { OtpVerificationModal } from './components/storefront/OtpVerificationModal'
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar'
import { FraudDashboard } from './components/admin/FraudDashboard'
import { RiskAuditQueue } from './components/admin/RiskAuditQueue'
import { FulfillmentKanban } from './components/admin/FulfillmentKanban'
import { EncryptedDbExplorer } from './components/admin/EncryptedDbExplorer'
import { BiometricLab } from './components/admin/BiometricLab'
import { CryptoVisualizerModal } from './components/common/CryptoVisualizerModal'
import { TamperAlertModal } from './components/common/TamperAlertModal'
import { NotificationToast } from './components/common/NotificationToast'
import { AuthModal } from './components/auth/AuthModal'
import { UserProfileModal } from './components/auth/UserProfileModal'
import { Sparkles, Shield, ShoppingBag, Flame, Zap } from 'lucide-react'

function MainContent() {
  const { products, selectedCategory, searchQuery } = useMarketplace()
  const { viewMode, toast, hideToast } = useSecurityOrder()
  const { isAdminAuthenticated } = useAuth()
  const [adminTab, setAdminTab] = useState<AdminTab>('DASHBOARD')

  // Filter products by category and search
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedCategory === 'ALL') return matchesSearch
    return matchesSearch && prod.category === selectedCategory
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col">
      <MarketplaceHeader />

      {viewMode === 'STOREFRONT' ? (
        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 w-full">
          {/* Flash Sale Banner Carousel */}
          <BannerCarousel />

          {/* Category Grid */}
          <CategoryGrid />

          {/* Flash Sale Header Strip */}
          <div className="my-6 flex items-center justify-between border-b border-orange-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-[#ee4d2d] text-white">
                <Flame className="size-4 fill-current" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  Gợi Ý Hôm Nay — Flash Sale
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sản phẩm chính hãng hỗ trợ giao hỏa tốc 2 giờ
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500 font-mono">
              Hiển thị: {filteredProducts.length} sản phẩm
            </span>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
              <ShoppingBag className="size-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600 text-sm">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Storefront Floating and Drawer Modals */}
          <CartDrawer />
          <CheckoutModal />
          <OtpVerificationModal />
        </main>
      ) : !isAdminAuthenticated ? (
        /* YÊU CẦU ĐĂNG NHẬP NẾU CHƯA XÁC THỰC ADMIN */
        <main className="flex-1">
          <AdminLoginPortal />
        </main>
      ) : (
        /* ADMIN OPERATIONS & SECURITY HUB (CHỈ DÀNH CHO QUẢN TRỊ VIÊN ĐÃ ĐĂNG NHẬP) */
        <main className="flex-1 bg-[#0f172a] text-slate-100 py-6 px-4 sm:px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Admin 5-module Navigation Bar */}
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
      )}

      {/* Global Security & Auth Modals */}
      <CryptoVisualizerModal />
      <TamperAlertModal />
      <AuthModal />
      <UserProfileModal />

      {/* Global Notification Toast */}
      {toast && (
        <NotificationToast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={hideToast}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 dark:text-white">Group 9</span>
            <span>—</span>
            <span>Hệ Thống Phát Hiện Gian Lận &amp; Mã Hóa Đơn Hàng Bằng AI</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Mã hóa AES-256-GCM</span>
            <span>•</span>
            <span>Blind Index HMAC-SHA256</span>
            <span>•</span>
            <span>Google Gemini 2.5 Flash / 2.0 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SecurityOrderProvider>
        <MarketplaceProvider>
          <MainContent />
        </MarketplaceProvider>
      </SecurityOrderProvider>
    </AuthProvider>
  )
}
