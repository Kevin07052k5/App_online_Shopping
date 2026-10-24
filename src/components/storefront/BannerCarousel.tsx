'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Flame, Shield, ArrowRight, Zap, Gift } from 'lucide-react'

export function BannerCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      id: 1,
      badge: 'SIÊU SALE CÔNG NGHỆ 2026',
      title: 'Đại Tiệc Gaming & Thiết Bị Số',
      subtitle: 'Giảm đến 50% + Freeship Xtra 0đ toàn quốc',
      gradient: 'from-orange-600 via-rose-600 to-amber-600',
      icon: '⚡',
      ctaText: 'Khám Phá Ngay',
    },
    {
      id: 2,
      badge: 'BẢO MẬT GIAO DỊCH VỚI AI',
      title: 'Hệ Thống Kiểm Soát Gian Lận Tự Động',
      subtitle: 'Tích hợp Google Gemini AI & Mã hóa CSDL chuẩn AES-256-GCM',
      gradient: 'from-emerald-700 via-teal-700 to-cyan-800',
      icon: '🛡️',
      ctaText: 'Tìm Hiểu Công Nghệ',
    },
    {
      id: 3,
      badge: 'BẢO VỆ DỮ LIỆU KHÁCH HÀNG',
      title: 'Blind Index HMAC-SHA256 & GMAC',
      subtitle: 'Tra cứu thông tin nhạy cảm O(1) mà không cần giải mã CSDL',
      gradient: 'from-purple-800 via-indigo-700 to-blue-800',
      icon: '🔒',
      ctaText: 'Xem Minh Họa',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const cur = slides[activeSlide]

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl my-4">
      <div
        className={`relative z-10 p-6 sm:p-10 transition-all duration-700 bg-gradient-to-r ${cur.gradient}`}
      >
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-bold text-white shadow-sm border border-white/20">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>{cur.badge}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight drop-shadow">
              {cur.title}
            </h2>

            <p className="text-xs sm:text-sm text-white/90 max-w-xl font-medium leading-relaxed">
              {cur.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <span className="rounded-xl bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border border-white/20">
                <Gift className="size-3.5 text-amber-300" />
                Voucher Freeship 30K
              </span>
              <span className="rounded-xl bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border border-white/20">
                <Zap className="size-3.5 text-amber-300" />
                Giao Hỏa Tốc 2H
              </span>
              <span className="rounded-xl bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border border-white/20">
                <Shield className="size-3.5 text-emerald-300" />
                Mã Hóa AES-256-GCM
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:flex justify-end">
            <div className="text-8xl select-none filter drop-shadow-2xl animate-pulse">
              {cur.icon}
            </div>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="mt-6 flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                activeSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
