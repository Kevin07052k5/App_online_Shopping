'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import { AuthUser } from '@/src/types/auth'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      const basePath =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/App_online_Shopping')
          ? '/App_online_Shopping'
          : ''

      try {
        const supabase = createClient()
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        let sessionUser: any = null

        // 1. Nếu có authorization code từ Supabase OAuth PKCE
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Supabase exchangeCodeForSession error:', error)
            throw error
          }
          sessionUser = data?.user || (await supabase.auth.getUser()).data.user
        } else {
          // 2. Nếu đã có session sẵn hoặc OAuth Implicit hash
          const { data } = await supabase.auth.getSession()
          sessionUser = data?.session?.user || (await supabase.auth.getUser()).data.user
        }

        if (!sessionUser) {
          // Thử lại sau 300ms trong trường hợp Supabase đang cập nhật storage ngầm
          await new Promise((r) => setTimeout(r, 300))
          const retry = await supabase.auth.getUser()
          sessionUser = retry.data.user
        }

        if (sessionUser) {
          if (!isMounted) return
          setStatus('SUCCESS')

          const metadata = sessionUser.user_metadata || {}
          const cleanEmail = sessionUser.email || metadata.email || ''
          const cleanName =
            metadata.full_name || metadata.name || cleanEmail.split('@')[0] || 'Khách hàng'
          const avatar =
            metadata.avatar_url ||
            metadata.picture ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'
          const rawProvider = (sessionUser.app_metadata?.provider || 'GOOGLE').toUpperCase()
          const provider = ['GOOGLE', 'APPLE', 'FACEBOOK', 'TWITTER', 'CREDENTIALS'].includes(rawProvider)
            ? rawProvider
            : 'GOOGLE'

          const authUser: AuthUser = {
            id: sessionUser.id,
            name: cleanName,
            email: cleanEmail,
            phoneNumber: metadata.phone_number || metadata.phone || '',
            role: 'USER',
            provider: provider as any,
            avatar: avatar,
            createdAt: sessionUser.created_at || new Date().toISOString(),
          }

          // Lưu trực tiếp vào LocalStorage của trình duyệt client
          localStorage.setItem('GROUP9_CURRENT_USER', JSON.stringify(authUser))

          // Đồng bộ thông tin vào bảng profiles của Supabase
          try {
            await supabase.from('profiles').upsert({
              id: sessionUser.id,
              email: cleanEmail,
              name: cleanName,
              phone_number: authUser.phoneNumber,
              role: 'USER',
              provider: provider as any,
              avatar_url: avatar,
              updated_at: new Date().toISOString(),
            })
          } catch (syncErr) {
            console.warn('Profile sync warn:', syncErr)
          }

          // Điều hướng về trang chủ với phiên đăng nhập đã sẵn sàng
          setTimeout(() => {
            window.location.href = (basePath || '') + '/'
          }, 350)
        } else {
          throw new Error('Không tìm thấy thông tin phiên đăng nhập từ tài khoản Google.')
        }
      } catch (err: any) {
        console.error('OAuth Callback processing failure:', err)
        if (!isMounted) return
        setStatus('ERROR')
        setErrorMessage(err.message || 'Lỗi xử lý xác thực tài khoản.')

        setTimeout(() => {
          window.location.href = (basePath || '') + '/?auth_error=' + encodeURIComponent(err.message || 'unknown')
        }, 2500)
      }
    }

    handleCallback()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4 animate-in fade-in duration-200">
        {status === 'LOADING' && (
          <>
            <div className="size-16 mx-auto rounded-2xl bg-orange-500/20 text-[#ee4d2d] flex items-center justify-center animate-pulse">
              <Sparkles className="size-8 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Đang Xác Thực Tài Khoản Google...</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống đang đồng bộ phiên đăng nhập và cấp chứng chỉ bảo mật. Vui lòng chờ trong giây lát.
            </p>
          </>
        )}

        {status === 'SUCCESS' && (
          <>
            <div className="size-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-emerald-400">Đăng Nhập Thành Công!</h3>
            <p className="text-xs text-slate-300">
              Chào mừng bạn đã quay trở lại. Đang chuyển hướng về trang chủ...
            </p>
          </>
        )}

        {status === 'ERROR' && (
          <>
            <div className="size-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <AlertCircle className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-rose-400">Xác Thực Chưa Thành Công</h3>
            <p className="text-xs text-rose-200 font-mono bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
              {errorMessage}
            </p>
            <p className="text-xs text-slate-400">Hệ thống đang đưa bạn quay lại trang chủ...</p>
          </>
        )}
      </div>
    </div>
  )
}

