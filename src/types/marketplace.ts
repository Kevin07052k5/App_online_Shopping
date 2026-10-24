export type ProductCategory = 'ELECTRONICS' | 'FASHION' | 'HOME' | 'GROCERY'

export interface CategoryItem {
  id: ProductCategory
  name: string
  icon: string
  description: string
  color: string
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  originalPrice: number
  discountPercent: number
  rating: number
  soldCount: number
  image: string
  stock: number
  description: string
  badge?: string
}

export type VoucherType = 'FREESHIP' | 'PERCENT' | 'FIXED'

export interface Voucher {
  code: string
  name: string
  description: string
  type: VoucherType
  discountValue: number // percentage or fixed amount
  maxDiscount?: number
  minOrderAmount: number
  isExploitMock?: boolean // mark if it's the VOUCHER_HACK_90 exploit demo
}

export interface CartItem {
  product: Product
  quantity: number
}
