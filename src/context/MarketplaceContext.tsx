'use client'

import React, { createContext, useContext, useState, useMemo } from 'react'
import { CartItem, Product, ProductCategory, Voucher } from '@/src/types/marketplace'
import { MOCK_PRODUCTS } from '@/src/data/mockProducts'
import { MOCK_VOUCHERS } from '@/src/data/mockVouchers'
import { CustomerPII } from '@/src/types/order'
import { FraudEvaluationPayload } from '@/src/types/fraud'

interface MarketplaceContextType {
  products: Product[]
  selectedCategory: ProductCategory | 'ALL'
  setSelectedCategory: (cat: ProductCategory | 'ALL') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  cart: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, delta: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setCartItems: (items: CartItem[]) => void
  vouchers: Voucher[]
  appliedVoucher: Voucher | null
  applyVoucher: (code: string) => { success: boolean; message: string }
  removeVoucher: () => void
  subtotal: number
  discountAmount: number
  shippingFee: number
  finalTotal: number
  cartCount: number
  isCartDrawerOpen: boolean
  setIsCartDrawerOpen: (open: boolean) => void
  isCheckoutModalOpen: boolean
  setIsCheckoutModalOpen: (open: boolean) => void
  isOtpModalOpen: boolean
  setIsOtpModalOpen: (open: boolean) => void
  pendingCheckoutPayload: {
    pii: CustomerPII
    telemetry: FraudEvaluationPayload
  } | null
  setPendingCheckoutPayload: (data: {
    pii: CustomerPII
    telemetry: FraudEvaluationPayload
  } | null) => void
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined)

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([
    // Initial standard items in cart
    { product: MOCK_PRODUCTS[2], quantity: 1 }, // Bàn phím cơ
  ])
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(MOCK_VOUCHERS[0]) // FREESHIP_MAX default

  // Modals & Drawer state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [pendingCheckoutPayload, setPendingCheckoutPayload] = useState<{
    pii: CustomerPII
    telemetry: FraudEvaluationPayload
  } | null>(null)

  // Add to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  // Remove single item
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Set cart directly (for preset buttons)
  const setCartItems = (items: CartItem[]) => {
    setCart(items)
  }

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  // Shipping fee calculation
  const defaultShippingFee = 30000
  const shippingFee = useMemo(() => {
    if (cart.length === 0) return 0
    if (appliedVoucher?.type === 'FREESHIP' && subtotal >= appliedVoucher.minOrderAmount) {
      return 0
    }
    return defaultShippingFee
  }, [cart.length, appliedVoucher, subtotal])

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedVoucher || cart.length === 0) return 0
    if (subtotal < appliedVoucher.minOrderAmount) return 0

    if (appliedVoucher.type === 'FREESHIP') {
      return defaultShippingFee
    }

    if (appliedVoucher.type === 'PERCENT') {
      const calc = (subtotal * appliedVoucher.discountValue) / 100
      if (appliedVoucher.maxDiscount) {
        return Math.min(calc, appliedVoucher.maxDiscount)
      }
      return calc
    }

    if (appliedVoucher.type === 'FIXED') {
      return appliedVoucher.discountValue
    }

    return 0
  }, [appliedVoucher, subtotal, cart.length])

  // Final total
  const finalTotal = useMemo(() => {
    if (cart.length === 0) return 0
    const total = subtotal + shippingFee - (appliedVoucher?.type === 'FREESHIP' ? 0 : discountAmount)
    return Math.max(0, total)
  }, [subtotal, shippingFee, discountAmount, appliedVoucher, cart.length])

  // Cart total item count
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Apply voucher by code
  const applyVoucher = (code: string) => {
    const voucher = MOCK_VOUCHERS.find((v) => v.code.toUpperCase() === code.trim().toUpperCase())
    if (!voucher) {
      return { success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn!' }
    }
    if (subtotal < voucher.minOrderAmount) {
      return {
        success: false,
        message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderAmount.toLocaleString('vi-VN')}₫ để áp dụng mã này!`,
      }
    }
    setAppliedVoucher(voucher)
    return { success: true, message: `Áp dụng thành công mã: ${voucher.name}` }
  }

  // Remove voucher
  const removeVoucher = () => {
    setAppliedVoucher(null)
  }

  return (
    <MarketplaceContext.Provider
      value={{
        products,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setCartItems,
        vouchers: MOCK_VOUCHERS,
        appliedVoucher,
        applyVoucher,
        removeVoucher,
        subtotal,
        discountAmount,
        shippingFee,
        finalTotal,
        cartCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isOtpModalOpen,
        setIsOtpModalOpen,
        pendingCheckoutPayload,
        setPendingCheckoutPayload,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  )
}

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext)
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider')
  }
  return context
}
