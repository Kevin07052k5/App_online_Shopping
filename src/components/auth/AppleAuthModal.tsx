'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

interface AppleAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AppleAuthModal({ isOpen, onClose }: AppleAuthModalProps) {
  const { loginWithApple } = useAuth()
  const { showToast } = useSecurityOrder()

  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Khương Gia Phát')
  const [userEmail, setUserEmail] = useState('khuonggiaphat7up@icloud.com')
  const [hideEmail, setHideEmail] = useState(false)

  if (!isOpen) return null

  const handleOAuthSuccess = () => {
    setIsLoading(true)

    const finalEmail = hideEmail
      ? `privaterelay_${Math.random().toString(36).substring(7)}@privaterelay.appleid.com`
      : userEmail

    setTimeout(async () => {
      await loginWithApple({
        name: userName,
        email: finalEmail,
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0977665544',
      })
      setIsLoading(false)
      showToast('SUCCESS', 'Đăng nhập Apple ID thành công', `Chào mừng ${userName} (${finalEmail})`)
      onClose()
    }, 600)
  }

  const shortName = userName.split(' ').slice(-1)[0] || 'Phát'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] rounded-2xl bg-[#1c1c1e] text-[#f5f5f7] border border-[#38383a] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="h-1 bg-[#2c2c2e] overflow-hidden">
            <div className="h-full bg-white animate-pulse w-full" />
          </div>
        )}

        {/* Thanh tiêu đề cửa sổ Chrome */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#2c2c2e] border-b border-[#38383a] text-xs text-[#aeaeb2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
            <span className="ml-2 truncate max-w-[240px] font-medium">Đăng nhập bằng Apple ID - Google Chrome</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="hover:text-white text-base transition px-1 disabled:opacity-50"
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Nội dung Apple ID */}
        <div className="p-7 text-center">
          {/* Logo Apple chuẩn vector 24x24 */}
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-black mb-3 shadow-lg">
            <svg className="w-7 h-7 fill-black" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.87c.65-.79 1.1-1.89.97-2.87-.94.04-2.07.63-2.73 1.41-.58.67-1.1 1.76-.96 2.82 1.05.08 2.07-.57 2.72-1.36z" />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-white">Đăng nhập bằng Apple ID</h3>
          <p className="text-xs text-[#8e8e93] mt-1 mb-5">
            Sử dụng Apple ID của bạn để truy cập Group 9 Portal.
          </p>

          <div className="bg-[#2c2c2e] p-3 rounded-xl border border-[#38383a] text-left mb-4 space-y-2">
            <div className="flex items-center justify-between border-b border-[#38383a] pb-2 text-xs">
              <span className="text-[#8e8e93]">Tài khoản:</span>
              <span className="font-medium text-white">{userName}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#8e8e93]">Chia sẻ email:</span>
              <span className="font-mono text-xs text-white">{hideEmail ? 'Ẩn địa chỉ email' : userEmail}</span>
            </div>
            <label className="flex items-center gap-2 pt-2 text-[11px] text-[#8e8e93] cursor-pointer">
              <input
                type="checkbox"
                checked={hideEmail}
                onChange={(e) => setHideEmail(e.target.checked)}
                className="rounded text-white focus:ring-0"
              />
              <span>Ẩn địa chỉ email của tôi (Chuyển tiếp thư bảo mật)</span>
            </label>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleOAuthSuccess}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-semibold text-sm transition shadow active:scale-98 disabled:opacity-50"
            >
              Tiếp tục với Apple ID ({shortName})
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#aeaeb2] font-semibold text-sm transition active:scale-98"
            >
              Hủy
            </button>
          </div>

          <p className="text-[11px] text-[#636366] mt-5">
            Group 9 Portal tuân thủ chính sách bảo mật dữ liệu người dùng Apple ID.
          </p>
        </div>
      </div>
    </div>
  )
}
