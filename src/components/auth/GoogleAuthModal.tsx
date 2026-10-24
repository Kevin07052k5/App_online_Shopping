'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GoogleAuthModal({ isOpen, onClose }: GoogleAuthModalProps) {
  const { loginWithGoogle } = useAuth()
  const { showToast } = useSecurityOrder()

  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Khương Gia Phát')
  const [userEmail, setUserEmail] = useState('khuonggiaphat7up@gmail.com')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')

  if (!isOpen) return null

  const handleOAuthSuccess = (nameToUse: string, emailToUse: string) => {
    setIsLoading(true)

    setTimeout(async () => {
      await loginWithGoogle({
        name: nameToUse,
        email: emailToUse,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameToUse)}&backgroundColor=0284c7,ea580c,16a34a`,
        phoneNumber: '0908123456',
      })
      setIsLoading(false)
      showToast('SUCCESS', 'Đăng nhập Google thành công', `Chào mừng ${nameToUse} (${emailToUse})`)
      onClose()
      setShowCustomInput(false)
    }, 600)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customEmail.trim() || !customEmail.includes('@')) {
      showToast('WARNING', 'Email không hợp lệ', 'Vui lòng nhập địa chỉ Gmail hợp lệ.')
      return
    }
    const email = customEmail.trim().toLowerCase()
    const name = customName.trim() || email.split('@')[0]
    handleOAuthSuccess(name, email)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[460px] bg-[#131314] text-[#e3e3e3] rounded-2xl shadow-2xl border border-[#303134] overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="h-1 bg-[#1e1f20] overflow-hidden">
            <div className="h-full bg-[#4285F4] animate-pulse w-full" />
          </div>
        )}

        {/* Thanh tiêu đề cửa sổ Google Chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1f20] border-b border-[#303134] text-xs text-[#c4c7c5]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
            <span className="ml-2 truncate max-w-[240px] font-medium">Đăng nhập - Tài khoản Google</span>
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

        {/* Nội dung cửa sổ Google */}
        <div className="p-7">
          <div className="flex items-center gap-2 text-sm font-medium mb-6">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Đăng nhập bằng Google</span>
          </div>

          <h2 className="text-2xl font-normal text-white mb-2">Chọn tài khoản</h2>
          <p className="text-sm text-[#c4c7c5] mb-6">
            Tiếp tục tới <span className="text-[#a8c7fa] font-medium">Group 9 Portal</span>
          </p>

          {!showCustomInput ? (
            <div className="space-y-2">
              {/* Hàng chọn tài khoản chính */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleOAuthSuccess(userName, userEmail)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#282a2c] border-b border-[#303134] transition-all text-left group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{userName}</div>
                  <div className="text-xs text-[#8e918f] truncate">{userEmail}</div>
                </div>
              </button>

              {/* Hàng tài khoản phụ / Sử dụng tài khoản khác */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#282a2c] transition-all text-left text-[#c4c7c5] hover:text-white"
              >
                <div className="w-10 h-10 rounded-full border border-[#444746] flex items-center justify-center text-lg shrink-0">
                  👤
                </div>
                <div className="text-sm font-medium">Sử dụng một tài khoản khác</div>
              </button>
            </div>
          ) : (
            /* Form nhập tài khoản khác */
            <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs text-[#c4c7c5] mb-1">Email hoặc số điện thoại</label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-[#1e1f20] border border-[#444746] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a8c7fa]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#c4c7c5] mb-1">Họ và tên hiển thị (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Khương Gia Phát"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#1e1f20] border border-[#444746] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a8c7fa]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-4 py-2 text-xs font-medium text-[#c4c7c5] hover:text-white"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg bg-[#a8c7fa] hover:bg-[#8ab4f8] text-[#041e49] text-xs font-semibold transition"
                >
                  Tiếp tục
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-[#8e918f] mt-8 leading-relaxed">
            Trước khi sử dụng Group 9 Portal, bạn có thể xem{' '}
            <span className="text-[#a8c7fa] hover:underline cursor-pointer">Chính sách quyền riêng tư</span> và{' '}
            <span className="text-[#a8c7fa] hover:underline cursor-pointer">Điều khoản dịch vụ</span> của ứng dụng này.
          </p>
        </div>
      </div>
    </div>
  )
}
