'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Package,
  Scan,
  Save,
  CheckCircle2,
  Sparkles,
  Camera,
  ExternalLink,
  Lock,
  LogOut,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { FaceBiometricModal } from '@/src/components/biometric/FaceBiometricModal'
import { getOwnerProfile } from '@/src/services/sfaceService'

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
]

export function UserProfileModal() {
  const { currentUser, isProfileModalOpen, setIsProfileModalOpen, updateProfile, logout } = useAuth()
  const { orders, showToast } = useSecurityOrder()

  const [activeTab, setActiveTab] = useState<'INFO' | 'ORDERS' | 'SECURITY'>('INFO')
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isBiometricScanOpen, setIsBiometricScanOpen] = useState(false)
  const [ownerFaceProfile, setOwnerFaceProfile] = useState<any>(null)

  // Load user data into form
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '')
      setPhoneNumber(currentUser.phoneNumber || '')
      setAddress(currentUser.address || '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM')
      setAvatar(currentUser.avatar || AVATAR_PRESETS[0])
    }
  }, [currentUser, isProfileModalOpen])

  // Check face profile status
  useEffect(() => {
    if (isProfileModalOpen) {
      const profile = getOwnerProfile()
      setOwnerFaceProfile(profile)
    }
  }, [isProfileModalOpen, isBiometricScanOpen])

  if (!isProfileModalOpen || !currentUser) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('WARNING', 'Thiếu thông tin', 'Họ và tên không được để trống')
      return
    }

    setIsSaving(true)
    const res = await updateProfile({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      avatar,
    })
    setIsSaving(false)

    if (res.success) {
      showToast('SUCCESS', 'Cập nhật thành công', 'Thông tin cá nhân đã được lưu an toàn!')
    } else {
      showToast('DANGER', 'Lỗi cập nhật', res.error || 'Không thể cập nhật hồ sơ')
    }
  }

  // Format order date
  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Provider badge color & name
  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'GOOGLE':
        return { label: 'Tài khoản Google', color: 'bg-blue-500/15 text-blue-500 border-blue-500/30' }
      case 'FACEBOOK':
        return { label: 'Tài khoản Facebook', color: 'bg-blue-600/15 text-blue-600 border-blue-600/30' }
      case 'APPLE':
        return { label: 'Tài khoản Apple ID', color: 'bg-slate-800 text-slate-200 border-slate-700' }
      case 'TWITTER':
        return { label: 'Tài khoản X (Twitter)', color: 'bg-black text-white border-slate-800' }
      default:
        return { label: 'Tài khoản Mật khẩu', color: 'bg-orange-500/15 text-orange-600 border-orange-500/30' }
    }
  }

  const providerInfo = getProviderBadge(currentUser.provider)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header Cover Banner */}
        <div className="relative bg-gradient-to-r from-[#ee4d2d] via-orange-500 to-amber-500 px-6 pt-6 pb-16 text-white shrink-0">
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute right-4 top-4 rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-100">
            <Sparkles className="size-4" />
            <span>Trung Tâm Tài Khoản Khách Hàng (Buyer Profile)</span>
          </div>
          <h2 className="text-xl font-black mt-1">Hồ Sơ &amp; Cài Đặt Cá Nhân</h2>
          <p className="text-xs text-orange-100">Quản lý thông tin giao hàng, lịch sử đơn hàng và an toàn sinh trắc học</p>
        </div>

        {/* User Card Floating Bar */}
        <div className="relative px-6 -mt-10 shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={avatar}
                  alt={name}
                  className="size-18 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-lg"
                />
                <div
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                  title="Thay đổi ảnh đại diện"
                  onClick={() => {
                    const nextIdx = (AVATAR_PRESETS.indexOf(avatar) + 1) % AVATAR_PRESETS.length
                    setAvatar(AVATAR_PRESETS[nextIdx])
                  }}
                >
                  <Camera className="size-5" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name || 'Khách hàng'}</h3>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Khách Hàng Thân Thiết
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${providerInfo.color}`}
                  >
                    {providerInfo.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ID: <code className="font-mono text-[9px]">{currentUser.id.slice(0, 12)}...</code>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('INFO')}
              className={`pb-3 flex items-center gap-1.5 transition cursor-pointer relative ${
                activeTab === 'INFO'
                  ? 'text-[#ee4d2d] border-b-2 border-[#ee4d2d]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <User className="size-4" />
              <span>Thông Tin Cá Nhân</span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`pb-3 flex items-center gap-1.5 transition cursor-pointer relative ${
                activeTab === 'ORDERS'
                  ? 'text-[#ee4d2d] border-b-2 border-[#ee4d2d]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Package className="size-4" />
              <span>Đơn Hàng Đã Đặt</span>
              <span className="rounded-full bg-orange-100 dark:bg-orange-950 text-[#ee4d2d] px-1.5 py-0.2 text-[10px]">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SECURITY')}
              className={`pb-3 flex items-center gap-1.5 transition cursor-pointer relative ${
                activeTab === 'SECURITY'
                  ? 'text-[#ee4d2d] border-b-2 border-[#ee4d2d]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="size-4" />
              <span>Bảo Mật &amp; SFace Face ID</span>
              {ownerFaceProfile && (
                <span className="size-2 rounded-full bg-emerald-500" title="Đã có Face ID" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* 1. THÔNG TIN CÁ NHÂN */}
          {activeTab === 'INFO' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Chọn Ảnh Đại Diện (Avatar Presets)
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <img
                      key={idx}
                      src={p}
                      alt="Preset"
                      onClick={() => setAvatar(p)}
                      className={`size-10 rounded-xl object-cover cursor-pointer transition border-2 ${
                        avatar === p
                          ? 'border-[#ee4d2d] scale-105 shadow-md'
                          : 'border-transparent hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Họ và Tên Người Mua <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:border-[#ee4d2d] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Địa Chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Số Điện Thoại Nhận Hàng
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0908123456"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:border-[#ee4d2d] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Ngày Gia Nhập Hệ Thống
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      disabled
                      value={formatOrderDate(currentUser.createdAt)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Địa Chỉ Nhận Hàng Mặc Định
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:border-[#ee4d2d] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-orange-600 hover:from-[#d94124] hover:to-orange-700 text-white font-bold transition shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="size-4" />
                  <span>{isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. ĐƠN HÀNG CỦA TÔI */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400">
                  Danh sách đơn hàng của bạn được bảo vệ bằng mã hóa chuẩn AES-256-GCM.
                </p>
                <span className="text-[11px] font-bold text-[#ee4d2d]">
                  Tổng {orders.length} đơn hàng
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Package className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">Bạn chưa có đơn hàng nào.</p>
                  <p className="text-slate-400 text-[11px] mt-1">Hãy khám phá sản phẩm và mua sắm ngay!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {ord.orderCode}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatOrderDate(ord.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                            {ord.fulfillmentStatus === 'PAID_APPROVED'
                              ? 'Đã Duyệt Thanh Toán'
                              : ord.fulfillmentStatus === 'PACKAGING'
                              ? 'Đang Đóng Gói'
                              : ord.fulfillmentStatus === 'IN_TRANSIT'
                              ? 'Đang Vận Chuyển'
                              : ord.fulfillmentStatus === 'DELIVERED'
                              ? 'Giao Thành Công'
                              : ord.fulfillmentStatus}
                          </span>

                          <span className="rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold">
                            {ord.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="size-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate text-xs">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                {item.price.toLocaleString('vi-VN')}₫ × {item.quantity}
                              </p>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary and Security Tag */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <ShieldCheck className="size-3.5" />
                          <span>PII Mã Hóa AES-256-GCM (HMAC Blind Index)</span>
                        </span>

                        <div className="text-right">
                          <span className="text-slate-400 mr-2">Tổng thanh toán:</span>
                          <span className="text-sm font-black text-[#ee4d2d]">
                            {ord.finalTotalAmount.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. BẢO MẬT & SINH TRẮC HỌC SFACE */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              {/* SFace Card */}
              <div className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-slate-900 text-slate-100 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                      <Scan className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-cyan-200">
                        Xác Thực Sinh Trắc Học Khuôn Mặt (SFace Face ID)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Mô hình mạng nơ-ron tích chập trích xuất 128 chiều vector đặc trưng chống giả mạo
                      </p>
                    </div>
                  </div>

                  {ownerFaceProfile ? (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 px-3 py-1 text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      <span>Đã Kích Hoạt Face ID</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 px-3 py-1 text-[11px] font-bold flex items-center gap-1.5">
                      <ShieldAlert className="size-3.5" />
                      <span>Chưa Quét Khuôn Mặt</span>
                    </span>
                  )}
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-[11px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Chủ tài khoản đăng ký:</span>
                    <span className="font-semibold text-white">
                      {ownerFaceProfile ? ownerFaceProfile.name : name || 'Chưa thiết lập'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vector nhận diện (SFace Embedding):</span>
                    <span className="font-mono text-cyan-300">
                      {ownerFaceProfile ? '128-D Float Vector (ONNX layer fc1)' : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bảo vệ chống giả mạo (Anti-Spoofing):</span>
                    <span className="text-emerald-400 font-semibold">
                      Phát hiện chớp mắt + Quét vân sọc Moiré màn hình
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    Sử dụng Face ID khi xác nhận đơn hàng giá trị cao hoặc thay đổi thông tin nhạy cảm.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsBiometricScanOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                  >
                    <Scan className="size-4" />
                    <span>{ownerFaceProfile ? 'Quét / Cập Nhật Lại' : 'Đăng Ký Khuôn Mặt Ngay'}</span>
                  </button>
                </div>
              </div>

              {/* Encryption & Security Policies */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Lock className="size-4 text-orange-500" />
                  <span>Chính Sách Quyền Riêng Tư &amp; Mã Hóa PII</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Thông tin cá nhân (Họ tên, SĐT, Địa chỉ) của người mua khi đặt hàng đều được tự động băm bảo vệ bằng thuật toán HMAC-SHA256 (Chỉ mục mù Blind Index) và mã hóa đối xứng AES-256-GCM. Quản trị viên chỉ có thể giải mã khi có quyền kiểm toán bảo mật.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SFace Biometric Modal */}
      <FaceBiometricModal
        isOpen={isBiometricScanOpen}
        onCancel={() => setIsBiometricScanOpen(false)}
        title="Quét & Cập Nhật Face ID (SFace ONNX)"
        subtitle="Quét khuôn mặt trực tiếp để kích hoạt thanh toán và bảo vệ tài khoản"
        targetRole="CUSTOMER"
        onVerified={() => {
          setIsBiometricScanOpen(false)
          setOwnerFaceProfile(getOwnerProfile())
          showToast('SUCCESS', 'Xác thực khuôn mặt thành công', 'Hồ sơ SFace của bạn đã được cập nhật!')
        }}
      />
    </div>
  )
}
