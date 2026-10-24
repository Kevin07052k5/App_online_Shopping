'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

interface TwitterAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TwitterAuthModal({ isOpen, onClose }: TwitterAuthModalProps) {
  const { loginWithTwitter } = useAuth()
  const { showToast } = useSecurityOrder()

  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Khương Gia Phát')
  const [handle, setHandle] = useState('@khuonggiaphat')

  if (!isOpen) return null

  const handleOAuthSuccess = () => {
    setIsLoading(true)

    setTimeout(async () => {
      await loginWithTwitter({
        name: userName,
        email: 'khuonggiaphat7up@x.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0919887766',
      })
      setIsLoading(false)
      showToast('SUCCESS', 'Đăng nhập X (Twitter) thành công', `Chào mừng ${userName} (${handle})`)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] rounded-2xl bg-black text-white border border-[#2f3336] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="h-1 bg-[#16181c] overflow-hidden">
            <div className="h-full bg-white animate-pulse w-full" />
          </div>
        )}

        {/* Thanh tiêu đề cửa sổ Chrome */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#16181c] border-b border-[#2f3336] text-xs text-[#71767b]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
            <span className="ml-2 truncate max-w-[240px] font-medium">X - Google Chrome</span>
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

        {/* Nội dung X */}
        <div className="p-7">
          {/* Logo X nét đôi */}
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-black mb-4 shadow">
            <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-center text-white">Ủy quyền Group 9 Portal</h3>
          <p className="text-xs text-[#71767b] text-center mt-1 mb-5">
            Ứng dụng sẽ có quyền đọc các bài đăng và thông tin hồ sơ của bạn.
          </p>

          <div className="bg-[#16181c] p-3 rounded-xl border border-[#2f3336] flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-base">
              P
            </div>
            <div>
              <div className="font-bold text-sm text-white">{userName}</div>
              <div className="text-xs text-[#71767b] font-mono">{handle}</div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleOAuthSuccess}
              className="w-full py-2.5 rounded-full bg-white hover:bg-slate-200 text-black font-bold text-sm transition active:scale-98 disabled:opacity-50"
            >
              Ủy quyền ứng dụng
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="w-full py-2.5 rounded-full border border-[#536471] hover:bg-[#181818] text-white font-bold text-sm transition active:scale-98"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
