import { CiphertextPackage, EncryptedPIIPackage } from './crypto'
import { AIExplanation } from './fraud'
import { CartItem } from './marketplace'

export type PaymentMethod = 'COD' | 'CREDIT_CARD' | 'QR_NAPAS' | 'E_WALLET'

export type FulfillmentStatus =
  | 'PAID_APPROVED' // 1. Đã duyệt thanh toán
  | 'PACKAGING'     // 2. Người bán đang đóng gói
  | 'IN_TRANSIT'    // 3. Đang vận chuyển (SPX Express / J&T)
  | 'DELIVERED'     // 4. Giao hàng thành công
  | 'HOLD_REVIEW'   // Tạm giữ rủi ro
  | 'CANCELLED'     // Hủy & Khóa

export interface CustomerPII {
  customerName: string
  phoneNumber: string
  deliveryAddress: string
  customerEmail: string
  cardNumber?: string
}

export interface OrderItemSummary {
  productId: string
  name: string
  price: number
  quantity: number
  category: string
  image: string
}

export interface EncryptedOrder {
  id: string
  orderCode: string
  createdAt: string
  // Encrypted PII fields (AES-256-GCM)
  encryptedPII: EncryptedPIIPackage
  // Blind Index (HMAC-SHA256) on phone number
  phoneBlindIndex: string
  // Integrity Checksum (SHA-256)
  recordChecksum: string
  // Business fields
  items: OrderItemSummary[]
  itemsCount: number
  subtotalAmount: number
  discountAmount: number
  shippingFee: number
  finalTotalAmount: number
  appliedVoucherCode?: string
  paymentMethod: PaymentMethod
  // Telemetry metadata
  deviceEntropy: string
  clientIp: string
  checkoutVelocitySec: number
  // Security & AI audit
  aiExplanation: AIExplanation
  fulfillmentStatus: FulfillmentStatus
  // Tampering simulation state
  isTampered?: boolean
  tamperedDescription?: string
  // Authorized decrypted cache
  decryptedPII?: CustomerPII
}
