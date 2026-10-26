"use client";

import React, { useState } from "react";

type OAuthProvider = "google" | "facebook" | "apple" | "x" | null;

export default function SocialAuthSection() {
  const [activePopup, setActivePopup] = useState<OAuthProvider>(null);
  const [userName, setUserName] = useState("Khương Gia Phát");
  const [userEmail, setUserEmail] = useState("khuonggiaphat7up@gmail.com");

  const handleOAuthSuccess = (provider: string) => {
    setActivePopup(null);
    alert(`Đăng nhập thành công qua ${provider.toUpperCase()}!`);
    // Dev Bear có thể gọi API xác thực hoặc lưu state đăng nhập tại đây
  };

  return (
    <div className="w-full my-6">
      {/* 4 NÚT HÌNH VUÔNG BO TRÒN THEO ĐÚNG MẪU */}
      <div className="flex items-center justify-center gap-4">
        {/* 1. GOOGLE */}
        <button
          type="button"
          onClick={() => setActivePopup("google")}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all"
          title="Đăng nhập với Google"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </button>

        {/* 2. APPLE (Đã fix chuẩn path 24x24 không bao giờ bị lỗi icon) */}
        <button
          type="button"
          onClick={() => setActivePopup("apple")}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all"
          title="Đăng nhập với Apple"
        >
          <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.87c.65-.79 1.1-1.89.97-2.87-.94.04-2.07.63-2.73 1.41-.58.67-1.1 1.76-.96 2.82 1.05.08 2.07-.57 2.72-1.36z" />
          </svg>
        </button>

        {/* 3. FACEBOOK */}
        <button
          type="button"
          onClick={() => setActivePopup("facebook")}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all"
          title="Đăng nhập với Facebook"
        >
          <svg className="w-7 h-7 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        {/* 4. X (TWITTER) */}
        <button
          type="button"
          onClick={() => setActivePopup("x")}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:scale-95 transition-all"
          title="Đăng nhập với X"
        >
          <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
      </div>

      {/* ============================================================== */}
      {/* POPUP GIẢ LẬP GOOGLE OAUTH ACCOUNT CHOOSER (Y HỆT HÌNH DEV BEAR GỬI) */}
      {/* ============================================================== */}
      {activePopup === "google" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-[460px] bg-[#131314] text-[#e3e3e3] rounded-2xl shadow-2xl border border-[#303134] overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Thanh tiêu đề cửa sổ Google Chrome */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1f20] border-b border-[#303134] text-xs text-[#c4c7c5]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
                <span className="ml-2 truncate max-w-[240px]">Đăng nhập - Tài khoản Google</span>
              </div>
              <button onClick={() => setActivePopup(null)} className="hover:text-white text-base">✕</button>
            </div>

            {/* Nội dung cửa sổ Google */}
            <div className="p-7">
              <div className="flex items-center gap-2 text-sm font-medium mb-6">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </div>

              <h2 className="text-2xl font-normal text-white mb-2">Chọn tài khoản</h2>
              <p className="text-sm text-[#c4c7c5] mb-6">Tiếp tục tới <span className="text-[#a8c7fa] font-medium">Group 9 Portal</span></p>

              {/* Hàng chọn tài khoản */}
              <button
                type="button"
                onClick={() => handleOAuthSuccess("Google")}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#282a2c] border-b border-[#303134] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold flex items-center justify-center text-lg">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{userName}</div>
                  <div className="text-xs text-[#8e918f] truncate">{userEmail}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSuccess("Google")}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#282a2c] transition-all text-left mt-2"
              >
                <div className="w-10 h-10 rounded-full border border-[#444746] flex items-center justify-center text-lg text-[#c4c7c5]">
                  👤
                </div>
                <div className="text-sm font-medium text-[#c4c7c5]">Sử dụng một tài khoản khác</div>
              </button>

              <p className="text-xs text-[#8e918f] mt-8 leading-relaxed">
                Trước khi sử dụng Group 9 Portal, bạn có thể xem <span className="text-[#a8c7fa] cursor-pointer">Chính sách quyền riêng tư</span> và <span className="text-[#a8c7fa] cursor-pointer">Điều khoản dịch vụ</span> của ứng dụng này.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP GIẢ LẬP FACEBOOK OAUTH CONSENT (Y HỆT HÌNH DEV BEAR GỬI) */}
      {/* ============================================================== */}
      {activePopup === "facebook" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-[440px] bg-[#242526] text-[#e4e6eb] rounded-2xl shadow-2xl border border-[#3e4042] overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Header Facebook */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#18191a] border-b border-[#393a3b]">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-600 text-[10px] flex items-center justify-center font-bold">P</div>
                <span className="text-xs font-semibold">{userName}</span>
              </div>
            </div>

            {/* Content Quyền Truy Cập */}
            <div className="p-6">
              <div className="flex items-center justify-center gap-4 my-3">
                <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-xl font-bold">f</div>
                <span className="text-gray-400">⇄</span>
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-md">🛡️</div>
              </div>

              <h3 className="text-base font-semibold text-white mt-4 mb-2">
                Group 9 Portal đang yêu cầu quyền truy cập vào:
              </h3>
              <ul className="text-sm text-[#b0b3b8] space-y-1.5 list-disc list-inside mb-4">
                <li>Tên và ảnh đại diện</li>
                <li>Địa chỉ email</li>
                <li>Sinh nhật</li>
              </ul>

              <button type="button" className="text-xs text-[#2e89ff] font-medium hover:underline mb-6 block">
                Chỉnh sửa quyền truy cập
              </button>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSuccess("Facebook")}
                  className="w-full py-2.5 rounded-xl bg-[#2374e1] hover:bg-[#1b64c2] text-white font-semibold text-sm transition-all"
                >
                  Tiếp tục dưới tên {userName.split(" ").slice(-1)[0]}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-full py-2.5 rounded-xl bg-[#3a3b3c] hover:bg-[#4e4f50] text-[#e4e6eb] font-semibold text-sm transition-all"
                >
                  Hủy
                </button>
              </div>

              <p className="text-[11px] text-[#8a8d91] mt-5 leading-normal">
                Bằng cách tiếp tục, Group 9 Portal sẽ được quyền truy cập liên tục vào thông tin mà bạn chia sẻ.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}