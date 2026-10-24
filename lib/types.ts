export interface Product {
  id: string
  name: string
  origin: string
  originalPrice: number
  price: number
  unit: string
  image: string
  description: string
  rating: number
  badge?: string
  inStock: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export type PaymentMethod = 'COD' | 'QR_TRANSFER' | 'CREDIT_CARD'

export interface CustomerFormData {
  customer_name: string
  phone: string
  email: string
  shipping_address: string
  payment_method: PaymentMethod
  note?: string
}

export interface TransactionPayload {
  customer_name: string
  phone: string
  email: string
  shipping_address: string
  total_amount: number
  items_count: number
  payment_method: PaymentMethod
  client_ip: string
  ip_country: string
  device_fingerprint: string
  cart_duration_seconds: number
  timestamp?: string
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type DecisionType = 'APPROVED' | 'CHALLENGE_OTP' | 'HOLD_REVIEW'

export interface AIAnalysisResult {
  riskScore: number // 0 - 100
  riskLevel: RiskLevel
  decision: DecisionType
  reasons: string[]
  summary: string
  analyzedAt: string
  model: string // 'gemini-1.5-flash' | 'mock-rule-engine' | etc.
}

export type OrderFulfillmentStatus = 
  | 'APPROVED'    // Cột 1: Đã duyệt
  | 'PACKAGING'   // Cột 2: Đang đóng gói
  | 'IN_TRANSIT'  // Cột 3: Đang giao hàng
  | 'DELIVERED'   // Cột 4: Hoàn tất
  | 'HOLD_REVIEW' // Tạm giữ rủi ro
  | 'REJECTED'    // Hủy & Chặn

export interface EncryptedField {
  ciphertextHex: string
  ivHex: string
  tagHex: string
}

export interface EncryptedOrderRecord {
  id: string
  orderCode: string
  createdAt: string
  // Encrypted fields (AES-256-GCM)
  enc_name: EncryptedField
  enc_phone: EncryptedField
  enc_addr: EncryptedField
  // Blind Index (HMAC-SHA256)
  phone_blind_index: string
  // Integrity Checksum (SHA-256)
  record_checksum: string
  // Order business data
  total_amount: number
  items_count: number
  items_summary: string
  items: {
    productId: string
    name: string
    price: number
    quantity: number
    unit: string
  }[]
  payment_method: PaymentMethod
  client_ip: string
  ip_country: string
  device_fingerprint: string
  cart_duration_seconds: number
  // Security & AI analysis
  ai_analysis: AIAnalysisResult
  status: OrderFulfillmentStatus
  // Tampering simulation state
  isTampered?: boolean
  tamperedDetails?: string
  original_record_checksum?: string
  // Decrypted plaintext cache when authorized
  decryptedData?: {
    customer_name: string
    phone: string
    shipping_address: string
  }
}

export interface SecurityAlert {
  id: string
  timestamp: string
  type: 'SAFE' | 'WARNING' | 'DANGER' | 'CRYPTO'
  title: string
  description: string
  orderCode?: string
}

export interface CryptoVisualStep {
  stepNumber: number
  title: string
  subtitle: string
  description: string
  dataPreview: {
    label: string
    value: string
    type?: 'plain' | 'key' | 'hex' | 'tag' | 'hash'
  }[]
}
