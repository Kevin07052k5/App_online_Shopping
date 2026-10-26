'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

type OAuthProvider = 'google' | 'facebook' | 'apple' | 'x' | null

interface SocialAuthSectionProps {
  onSuccess?: () => void
}

export default function SocialAuthSection({ onSuccess }: SocialAuthSectionProps) {
  const { loginWithGoogle, loginWithFacebook, loginWithApple, loginWithTwitter } = useAuth()
  const { showToast } = useSecurityOrder()

  const [activePopup, setActivePopup] = useState<OAuthProvider>(null)
  const [userName, setUserName] = useState('Khương Gia Phát')
  const [userEmail, setUserEmail] = useState('khuonggiaphat7up@gmail.com')
  const [customEmailMode, setCustomEmailMode] = useState(false)
  const [inputCustomEmail, setInputCustomEmail] = useState('')
  const [inputCustomName, setInputCustomName] = useState('')
  const [hideAppleEmail, setHideAppleEmail] = useState(false)

  // Xử lý đăng nhập thành công cho từng mạng xã hội
  const handleOAuthSuccess = async (provider: 'google' | 'facebook' | 'apple' | 'x') => {
    const finalName = customEmailMode && inputCustomName.trim() ? inputCustomName.trim() : userName
    const finalEmail = customEmailMode && inputCustomEmail.trim() ? inputCustomEmail.trim() : userEmail

    setActivePopup(null)
    setCustomEmailMode(false)

    if (provider === 'google') {
      await loginWithGoogle({
        name: finalName,
        email: finalEmail,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0908123456',
      })
      showToast('SUCCESS', 'Đăng nhập Google thành công', `Chào mừng ${finalName} (${finalEmail})`)
    } else if (provider === 'facebook') {
      await loginWithFacebook({
        name: finalName,
        email: finalEmail,
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0908123456',
      })
      showToast('SUCCESS', 'Đăng nhập Facebook thành công', `Chào mừng ${finalName} gia nhập Group 9!`)
    } else if (provider === 'apple') {
      const emailToUse = hideAppleEmail
        ? `relay_${Math.random().toString(36).substring(7)}@privaterelay.appleid.com`
        : finalEmail

      await loginWithApple({
        name: finalName,
        email: emailToUse,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0908123456',
      })
      showToast('SUCCESS', 'Đăng nhập Apple ID thành công', `Xác thực Apple ID: ${emailToUse}`)
    } else if (provider === 'x') {
      await loginWithTwitter({
        name: finalName,
        email: finalEmail,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
        phoneNumber: '0908123456',
      })
      showToast('SUCCESS', 'Đăng nhập X (Twitter) thành công', `Tài khoản X của ${finalName} đã được ủy quyền`)
    }

    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <div className="w-full my-4">
      {/* 4 NÚT HÌNH VUÔNG BO TRÒN THEO ĐÚNG MẪU */}
      <div className="flex items-center justify-center gap-4">
        {/* 1. GOOGLE */}
        <button
          type="button"
          onClick={() => {
            setCustomEmailMode(false)
            setActivePopup('google')
          }}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
          title="Đăng nhập với Google"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </button>

        {/* 2. APPLE (Đã fix chuẩn path 24x24 không bao giờ bị lỗi icon) */}
        <button
          type="button"
          onClick={() => {
            setCustomEmailMode(false)
            setActivePopup('apple')
          }}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
          title="Đăng nhập với Apple"
        >
          <svg className="w-6 h-6 fill-black dark:fill-white" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.87c.65-.79 1.1-1.89.97-2.87-.94.04-2.07.63-2.73 1.41-.58.67-1.1 1.76-.96 2.82 1.05.08 2.07-.57 2.72-1.36z" />
          </svg>
        </button>

        {/* 3. FACEBOOK */}
        <button
          type="button"
          onClick={() => {
            setCustomEmailMode(false)
            setActivePopup('facebook')
          }}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
          title="Đăng nhập với Facebook"
        >
          <svg className="w-7 h-7 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        {/* 4. X (TWITTER) */}
        <button
          type="button"
          onClick={() => {
            setCustomEmailMode(false)
            setActivePopup('x')
          }}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
          title="Đăng nhập với X"
        >
          <svg className="w-5 h-5 fill-black dark:fill-white" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. POPUP GIẢ LẬP GOOGLE OAUTH ACCOUNT CHOOSER (THEO FILE MẪU) */}
      {/* ============================================================== */}
      {activePopup === 'google' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-[460px] bg-[#131314] text-[#e3e3e3] rounded-2xl shadow-2xl border border-[#303134] overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Thanh tiêu đề cửa sổ Google Chrome */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1f20] border-b border-[#303134] text-xs text-[#c4c7c5]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
                <span className="ml-2 truncate max-w-[240px]">Đăng nhập - Tài khoản Google</span>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="hover:text-white text-base px-1.5 py-0.5 rounded hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Nội dung cửa sổ Google */}
            <div className="p-7">
              <div className="flex items-center gap-2 text-sm font-medium mb-6">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </div>

              <h2 className="text-2xl font-normal text-white mb-2">Chọn tài khoản</h2>
              <p className="text-sm text-[#c4c7c5] mb-6">
                Tiếp tục tới <span className="text-[#a8c7fa] font-medium">Group 9 Portal</span>
              </p>

              {!customEmailMode ? (
                <>
                  {/* Hàng chọn tài khoản mặc định của người dùng */}
                  <button
                    type="button"
                    onClick={() => handleOAuthSuccess('google')}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#282a2c] border-b border-[#303134] transition-all text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold flex items-center justify-center text-lg shrink-0">
                      P
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{userName}</div>
                      <div className="text-xs text-[#8e918f] truncate">{userEmail}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomEmailMode(true)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#282a2c] transition-all text-left mt-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full border border-[#444746] flex items-center justify-center text-lg text-[#c4c7c5] shrink-0">
                      👤
                    </div>
                    <div className="text-sm font-medium text-[#c4c7c5]">Sử dụng một tài khoản khác</div>
                  </button>
                </>
              ) : (
                /* Form nhập tài khoản Google khác */
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs text-[#c4c7c5] mb-1">Email hoặc số điện thoại</label>
                    <input
                      type="email"
                      required
                      placeholder="Nhập địa chỉ Gmail..."
                      value={inputCustomEmail}
                      onChange={(e) => setInputCustomEmail(e.target.value)}
                      className="w-full rounded-xl bg-[#1e1f20] border border-[#444746] px-3.5 py-2.5 text-sm text-white focus:border-[#a8c7fa] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#c4c7c5] mb-1">Tên hiển thị (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Họ và tên..."
                      value={inputCustomName}
                      onChange={(e) => setInputCustomName(e.target.value)}
                      className="w-full rounded-xl bg-[#1e1f20] border border-[#444746] px-3.5 py-2.5 text-sm text-white focus:border-[#a8c7fa] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCustomEmailMode(false)}
                      className="text-xs text-[#a8c7fa] hover:underline"
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthSuccess('google')}
                      disabled={!inputCustomEmail.trim()}
                      className="px-5 py-2 rounded-xl bg-[#a8c7fa] hover:bg-[#91bbf8] text-[#041e49] font-bold text-xs transition disabled:opacity-50"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-[#8e918f] mt-8 leading-relaxed">
                Trước khi sử dụng Group 9 Portal, bạn có thể xem{' '}
                <span className="text-[#a8c7fa] cursor-pointer hover:underline">Chính sách quyền riêng tư</span> và{' '}
                <span className="text-[#a8c7fa] cursor-pointer hover:underline">Điều khoản dịch vụ</span> của ứng dụng này.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. POPUP GIẢ LẬP FACEBOOK OAUTH CONSENT (THEO FILE MẪU) */}
      {/* ============================================================== */}
      {activePopup === 'facebook' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-[440px] bg-[#242526] text-[#e4e6eb] rounded-2xl shadow-2xl border border-[#3e4042] overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Header Facebook */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#18191a] border-b border-[#393a3b]">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-600 text-[10px] flex items-center justify-center font-bold">
                  P
                </div>
                <span className="text-xs font-semibold">{userName}</span>
              </div>
            </div>

            {/* Content Quyền Truy Cập */}
            <div className="p-6">
              <div className="flex items-center justify-center gap-4 my-3">
                <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-xl font-bold shadow-md">
                  f
                </div>
                <span className="text-gray-400 font-bold">⇄</span>
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  🛡️
                </div>
              </div>

              <h3 className="text-base font-semibold text-white mt-4 mb-2 text-center">
                Group 9 Portal đang yêu cầu quyền truy cập vào:
              </h3>
              <ul className="text-sm text-[#b0b3b8] space-y-1.5 list-disc list-inside mb-4 bg-[#18191a] p-3 rounded-xl border border-[#393a3b]">
                <li>Tên và ảnh đại diện</li>
                <li>Địa chỉ email ({userEmail})</li>
                <li>Trạng thái xác thực tài khoản</li>
              </ul>

              <button type="button" className="text-xs text-[#2e89ff] font-medium hover:underline mb-6 block">
                Chỉnh sửa quyền truy cập
              </button>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSuccess('facebook')}
                  className="w-full py-2.5 rounded-xl bg-[#2374e1] hover:bg-[#1b64c2] text-white font-semibold text-sm transition-all cursor-pointer shadow-md"
                >
                  Tiếp tục dưới tên {userName.split(' ').slice(-1)[0]}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-full py-2.5 rounded-xl bg-[#3a3b3c] hover:bg-[#4e4f50] text-[#e4e6eb] font-semibold text-sm transition-all cursor-pointer"
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
      )}

      {/* ============================================================== */}
      {/* 3. POPUP GIẢ LẬP APPLE ID OAUTH CONSENT */}
      {/* ============================================================== */}
      {activePopup === 'apple' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] bg-[#1c1c1e] text-[#f2f2f7] rounded-3xl shadow-2xl border border-[#38383a] overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Header Apple */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-[#2c2c2e]">
              <div className="mx-auto w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-md mb-3">
                <svg className="w-7 h-7 fill-black" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.87c.65-.79 1.1-1.89.97-2.87-.94.04-2.07.63-2.73 1.41-.58.67-1.1 1.76-.96 2.82 1.05.08 2.07-.57 2.72-1.36z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Đăng nhập bằng Apple</h3>
              <p className="text-xs text-slate-400 mt-1">Sử dụng Apple ID của bạn cho Group 9 Portal</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#2c2c2e] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tên:</span>
                  <span className="font-semibold text-white">{userName}</span>
                </div>
                <div className="border-t border-[#3a3a3c]" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Apple ID:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">{userEmail}</span>
                </div>
              </div>

              {/* Private Relay Email Option */}
              <div className="bg-[#2c2c2e] rounded-2xl p-3.5 space-y-2 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-white">Chia sẻ email của tôi</span>
                  <input
                    type="radio"
                    name="apple_email_pref"
                    checked={!hideAppleEmail}
                    onChange={() => setHideAppleEmail(false)}
                    className="accent-white size-4"
                  />
                </label>
                <div className="border-t border-[#3a3a3c]" />
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-medium text-white block">Ẩn địa chỉ email của tôi</span>
                    <span className="text-[10px] text-slate-400">Chuyển tiếp đến {userEmail}</span>
                  </div>
                  <input
                    type="radio"
                    name="apple_email_pref"
                    checked={hideAppleEmail}
                    onChange={() => setHideAppleEmail(true)}
                    className="accent-white size-4"
                  />
                </label>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleOAuthSuccess('apple')}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-slate-200 text-black font-bold text-xs transition cursor-pointer shadow-lg"
                >
                  Tiếp tục với Mật mã / Face ID
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-full py-2.5 rounded-2xl bg-[#2c2c2e] hover:bg-[#38383a] text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. POPUP GIẢ LẬP X (TWITTER) OAUTH CONSENT */}
      {/* ============================================================== */}
      {activePopup === 'x' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-[430px] bg-black text-[#e7e9ea] rounded-3xl shadow-2xl border border-[#2f3336] overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f3336]">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <button
                onClick={() => setActivePopup(null)}
                className="hover:text-white text-sm px-2 py-1 rounded-full hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Cho phép Group 9 Portal truy cập tài khoản X của bạn?</h3>
              <p className="text-xs text-[#71767b] mb-4">
                Ứng dụng này sẽ có thể xem hồ sơ và các bài viết công khai của bạn.
              </p>

              <div className="flex items-center gap-3 p-3 bg-[#16181c] rounded-2xl border border-[#2f3336] mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1d9bf0] text-white font-bold flex items-center justify-center text-sm">
                  P
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{userName}</div>
                  <div className="text-xs text-[#71767b]">@khuonggiaphat</div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSuccess('x')}
                  className="w-full py-3 rounded-full bg-white hover:bg-slate-200 text-black font-bold text-xs transition cursor-pointer shadow-md"
                >
                  Ủy quyền ứng dụng (Authorize app)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-full py-3 rounded-full bg-transparent hover:bg-white/10 text-white border border-[#536471] font-bold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
              </div>

              <p className="text-[10px] text-[#71767b] mt-5 text-center leading-relaxed">
                Bạn có thể thu hồi quyền truy cập này bất kỳ lúc nào trong Cài đặt bảo mật tài khoản X.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
