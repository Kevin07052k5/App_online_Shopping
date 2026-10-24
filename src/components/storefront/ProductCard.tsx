'use client'

import React from 'react'
import { Star, Plus, ShoppingCart, Zap } from 'lucide-react'
import { Product } from '@/src/types/marketplace'
import { formatVND } from '@/src/utils/helpers'
import { useMarketplace } from '@/src/context/MarketplaceContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, setIsCartDrawerOpen } = useMarketplace()
  const { showToast } = useSecurityOrder()

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart(product, 1)
    showToast('INFO', 'Đã thêm vào giỏ hàng', `${product.name} (x1)`)
  }

  const handleBuyNow = () => {
    addToCart(product, 1)
    setIsCartDrawerOpen(true)
  }

  return (
    <div
      onClick={handleBuyNow}
      className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-300 overflow-hidden cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-1 rounded-bl-xl shadow-md">
            -{product.discountPercent}%
          </div>
        )}

        {/* Mall or Top Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 rounded-lg bg-[#ee4d2d] text-white text-[9px] font-black uppercase px-2 py-0.5 shadow">
            {product.badge}
          </div>
        )}
      </div>

      {/* Product Body */}
      <div className="flex flex-1 flex-col p-3.5 justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#ee4d2d] transition line-clamp-2 leading-snug">
            {product.name}
          </h4>

          {/* Rating and Sold Count */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <div className="flex items-center text-amber-500 font-bold">
              <Star className="size-3 fill-current" />
              <span className="ml-0.5">{product.rating}</span>
            </div>
            <span>•</span>
            <span>Đã bán {product.soldCount > 1000 ? `${(product.soldCount / 1000).toFixed(1)}k` : product.soldCount}</span>
          </div>
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="text-sm sm:text-base font-black text-[#ee4d2d] font-mono leading-none">
              {formatVND(product.price)}
            </div>
            {product.originalPrice > product.price && (
              <div className="text-[10px] text-slate-400 line-through font-mono mt-0.5">
                {formatVND(product.originalPrice)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="flex size-8 items-center justify-center rounded-xl bg-orange-50 text-[#ee4d2d] border border-orange-200 hover:bg-[#ee4d2d] hover:text-white transition shadow-sm active:scale-90"
            title="Thêm vào giỏ hàng"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
