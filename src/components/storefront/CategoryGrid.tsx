'use client'

import React from 'react'
import { CATEGORIES_DATA } from '@/src/data/mockProducts'
import { useMarketplace } from '@/src/context/MarketplaceContext'
import { ProductCategory } from '@/src/types/marketplace'

export function CategoryGrid() {
  const { selectedCategory, setSelectedCategory } = useMarketplace()

  return (
    <section className="my-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
          <span>Danh Mục Ngành Hàng</span>
        </h3>
        {selectedCategory !== 'ALL' && (
          <button
            onClick={() => setSelectedCategory('ALL')}
            className="text-xs font-bold text-[#ee4d2d] hover:underline"
          >
            Xem tất cả
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* All Categories Button */}
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
            selectedCategory === 'ALL'
              ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d] shadow-sm font-bold scale-[1.02]'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className="text-2xl mb-1">🏷️</span>
          <span className="text-xs font-bold leading-tight">Tất Cả Sản Phẩm</span>
          <span className="text-[10px] text-slate-400 mt-0.5">10 Mặt Hàng</span>
        </button>

        {CATEGORIES_DATA.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d] shadow-sm font-bold scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-bold leading-tight line-clamp-1">{cat.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{cat.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
