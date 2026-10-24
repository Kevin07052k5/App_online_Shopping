'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

interface FacebookAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FacebookAuthModal({ isOpen, onClose }: FacebookAuthModalProps) {
  const { loginWithFacebook } = useAuth()
  const { showToast } = useSecurityOrder()

  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('Khương Gia Phát')
  const [userEmail, setUserEmail] = useState('khuonggiaphat7up@gmail.com')
  const [showEditPermissions, setShowEditPermissions] = useState(false)
  const [permissions, setPermissions] = useState({
    profile: true,
    email: true,
    birthday: true,
  })

  if (!isOpen) return null

  const handleOAuthSuccess = () => {
    setIsLoading(true)

    setTimeout(async () => {
      await loginWithFacebook({
        name: userName,
        email: userEmail,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0988112233',
      })
      setIsLoading(false)
      showToast('SUCCESS', 'Đăng nhập Facebook thành công', `Chào mừng ${userName} (${userEmail})`)
      onClose()
    }, 600)
  }

  const shortName = userName.split(' ').slice(-1)[0] || 'Phát'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-[#1c1e21] text-[#e4e6eb] rounded-2xl shadow-2xl border border-[#3e4042] overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="h-1 bg-[#18191a] overflow-hidden">
            <div className="h-full bg-[#1877F2] animate-pulse w-full" />
          </div>
        )}

        {/* Thanh tiêu đề cửa sổ Google Chrome */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#18191a] border-b border-[#303134] text-xs text-[#c4c7c5]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
            <span className="ml-2 truncate max-w-[240px] font-medium">Facebook - Google Chrome</span>
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

        {/* Header Facebook */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#242526] border-b border-[#393a3b]">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 text-[10px] flex items-center justify-center font-bold text-white">
              P
            </div>
            <span className="text-xs font-semibold text-slate-200">{userName}</span>
          </div>
        </div>

        {/* Content Quyền Truy Cập */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 my-2">
            <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-xl font-bold shadow-md">
              f
            </div>
            <span className="text-gray-400 text-lg">⇄</span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ee4d2d] to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
              🛡️
            </div>
          </div>

          <h3 className="text-base font-semibold text-white mt-4 mb-2 text-center">
            Group 9 Portal đang yêu cầu quyền truy cập vào:
          </h3>

          {!showEditPermissions ? (
            <ul className="text-sm text-[#b0b3b8] space-y-2 list-disc list-inside mb-4 pl-2">
              <li>Tên và ảnh đại diện</li>
              <li>Địa chỉ email ({userEmail})</li>
              <li>Sinh nhật</li>
            </ul>
          ) : (
            <div className="space-y-2 bg-[#242526] p-3 rounded-xl mb-4 border border-[#3e4042] text-xs">
              <label className="flex items-center justify-between text-slate-200 cursor-pointer">
                <span>Tên và ảnh đại diện (Bắt buộc)</span>
                <input type="checkbox" checked disabled className="rounded text-[#1877F2]" />
              </label>
              <label className="flex items-center justify-between text-slate-200 cursor-pointer">
                <span>Địa chỉ email</span>
                <input
                  type="checkbox"
                  checked={permissions.email}
                  onChange={(e) => setPermissions({ ...permissions, email: e.target.checked })}
                  className="rounded text-[#1877F2]"
                />
              </label>
              <label className="flex items-center justify-between text-slate-200 cursor-pointer">
                <span>Sinh nhật</span>
                <input
                  type="checkbox"
                  checked={permissions.birthday}
                  onChange={(e) => setPermissions({ ...permissions, birthday: e.target.checked })}
                  className="rounded text-[#1877F2]"
                />
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEditPermissions(!showEditPermissions)}
            className="text-xs text-[#2e89ff] font-medium hover:underline mb-6 block"
          >
            {showEditPermissions ? 'Thu gọn tùy chọn quyền' : 'Chỉnh sửa quyền truy cập'}
          </button>

          <div className="space-y-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleOAuthSuccess}
              className="w-full py-2.5 rounded-xl bg-[#2374e1] hover:bg-[#1b64c2] text-white font-semibold text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>Tiếp tục dưới tên {shortName}</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#3a3b3c] hover:bg-[#4e4f50] text-[#e4e6eb] font-semibold text-sm transition-all active:scale-98"
            >
              Hủy
            </button>
          </div>

          <p className="text-[11px] text-[#8a8d91] mt-5 leading-normal text-center">
            Bằng cách tiếp tục, Group 9 Portal sẽ được quyền truy cập liên tục vào thông tin mà bạn chia sẻ.
          </p>
        </div>
      </div>
    </div>
  )
}
