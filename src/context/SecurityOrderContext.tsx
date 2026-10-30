'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  CustomerPII,
  EncryptedOrder,
  FulfillmentStatus,
  OrderItemSummary,
  PaymentMethod,
} from '@/src/types/order'
import { AIExplanation, FraudEvaluationPayload } from '@/src/types/fraud'
import { IntegrityReport } from '@/src/types/crypto'
import {
  computeBlindIndex,
  computeRecordChecksum,
  encryptOrderPII,
  restoreTamperedOrder,
  simulateTamperCiphertext,
  verifyOrderIntegrity,
} from '@/src/services/webCryptoService'
import { generateOrderId } from '@/src/utils/helpers'
import { createClient } from '@/utils/supabase/client'

interface SecurityOrderContextType {
  orders: EncryptedOrder[]
  viewMode: 'STOREFRONT' | 'ADMIN'
  setViewMode: (mode: 'STOREFRONT' | 'ADMIN') => void
  apiKey: string
  setApiKey: (key: string) => void
  modelName: string
  setModelName: (model: string) => void
  isAuthorizedDecrypted: boolean
  toggleAuthorizedDecrypt: () => void
  // Modals state
  isCryptoVisualizerOpen: boolean
  setIsCryptoVisualizerOpen: (open: boolean) => void
  selectedOrderForCrypto: EncryptedOrder | null
  setSelectedOrderForCrypto: (order: EncryptedOrder | null) => void
  isXaiModalOpen: boolean
  setIsXaiModalOpen: (open: boolean) => void
  selectedOrderForXai: EncryptedOrder | null
  setSelectedOrderForXai: (order: EncryptedOrder | null) => void
  isTamperAlertOpen: boolean
  setIsTamperAlertOpen: (open: boolean) => void
  tamperAlertDetails: {
    orderCode: string
    report: IntegrityReport
  } | null
  // Toast Notification state
  toast: {
    type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO'
    title: string
    message: string
  } | null
  showToast: (type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO', title: string, message: string) => void
  hideToast: () => void
  // Operations
  createAndEncryptOrder: (params: {
    pii: CustomerPII
    items: OrderItemSummary[]
    subtotalAmount: number
    discountAmount: number
    shippingFee: number
    finalTotalAmount: number
    appliedVoucherCode?: string
    paymentMethod: PaymentMethod
    telemetry: FraudEvaluationPayload
    aiExplanation: AIExplanation
  }) => Promise<EncryptedOrder>
  updateFulfillmentStatus: (orderId: string, status: FulfillmentStatus) => void
  simulateTamper: (orderId: string) => void
  restoreTampered: (orderId: string) => Promise<void>
  verifyIntegrity: (orderId: string) => Promise<IntegrityReport>
  resetDatabaseToDefault: () => void
}

const SecurityOrderContext = createContext<SecurityOrderContextType | undefined>(undefined)

const INITIAL_ORDERS_SEED: EncryptedOrder[] = [
  {
    id: 'ord-seed-01',
    orderCode: 'ORD-2026-VN101',
    createdAt: '2026-10-13T14:15:20.000Z',
    encryptedPII: {
      customerName: {
        ciphertextHex: '2374f6f7bd95bad16b887c765e314fdf',
        ivHex: '86253e9227881f1e7df723b0',
        authTagHex: '09a30b2083a2fcc8de315cb69a697d35',
      },
      phoneNumber: {
        ciphertextHex: '607fbece68dfe4e17228',
        ivHex: 'fd70707d14a25ab02fe36400',
        authTagHex: '428e05e8f53c12d4815783c0ab5d23df',
      },
      deliveryAddress: {
        ciphertextHex: 'e8c69f72ce460b347d2d7cc7103eeda8b146776b702a1b27e5fed8a2fe897ea0a6136fb0d064cdb357ea24438a2f484ed47d4c2aa75d73275ae96657f85cfbd8a332a857',
        ivHex: '609987291d3625d208e21bb7',
        authTagHex: '659d8d2cda4da1a26ad680075b64cf3e',
      },
    },
    phoneBlindIndex: '35644895aea01693d157dff1b38315b3b3943a9f0d3a9a6f01c3a30772401d67',
    recordChecksum: '818c94c1bf523d5d8584b2fffdf3ce4aaee97ce85f9ae7d27fe05b33489e46d8',
    items: [
      {
        productId: 'prod-keyboard-rapid',
        name: 'Bàn Phím Cơ Rapid Trigger Hall Effect Magnetic Switch',
        price: 1890000,
        quantity: 1,
        category: 'ELECTRONICS',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=85',
      },
    ],
    itemsCount: 1,
    subtotalAmount: 1890000,
    discountAmount: 30000,
    shippingFee: 0,
    finalTotalAmount: 1860000,
    appliedVoucherCode: 'FREESHIP_MAX',
    paymentMethod: 'COD',
    deviceEntropy: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    clientIp: '113.161.45.12 (VNPT TP.HCM)',
    checkoutVelocitySec: 42.5,
    fulfillmentStatus: 'PAID_APPROVED',
    aiExplanation: {
      riskScore: 9,
      riskLevel: 'LOW',
      decision: 'APPROVED',
      reasons: [
        'Hành vi duyệt giỏ hàng bình thường (42.5 giây)',
        'Địa chỉ nội thành TP.HCM và SĐT mạng Viettel hợp lệ',
        'Áp voucher Freeship đúng hạn mức',
      ],
      summary: 'Giao dịch khách hàng cá nhân an toàn. Tự động thông qua.',
      modelName: 'gemini-2.5-flash',
      evaluatedAt: '2026-10-13T14:15:23.000Z',
    },
    decryptedPII: {
      customerName: 'Nguyễn Văn An',
      phoneNumber: '0908123456',
      deliveryAddress: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
      customerEmail: 'an.nguyen@gmail.com',
    },
  },
  {
    id: 'ord-seed-02',
    orderCode: 'ORD-2026-VN202',
    createdAt: '2026-10-13T15:20:45.000Z',
    encryptedPII: {
      customerName: {
        ciphertextHex: 'dc81ff4d676673cca8bd4c3bcd1b8505',
        ivHex: '32c75baa1d17e7efb7a7ca28',
        authTagHex: '6463907c5feff6e45212e3091b89a58f',
      },
      phoneNumber: {
        ciphertextHex: 'c034a6af3e2bea6a11c6',
        ivHex: 'b697947bc71ef6f143a641ed',
        authTagHex: '07eb6cc56acb14fdf95ba3fb9db06feb',
      },
      deliveryAddress: {
        ciphertextHex: 'c9249788c7948fedf4fa343cb3a471e10aea9ec547023af015b893df81c2e140a68934a7d3bc6288732a2d08e2668f2fbfaca8792ef5a6',
        ivHex: '77d9fa49ad7e8f4cfb0391e4',
        authTagHex: '577e720677ee1caa7c34e0713fafc085',
      },
    },
    phoneBlindIndex: '45e8a8ef8f7948a15f1d5b0e949943e8afe73bc24f9e3099ea71ea595a7bcd81',
    recordChecksum: '4446707f8657abb413ccfa76fe07091b0937e7eae5ea3bb7585dceee98cfb51b',
    items: [
      {
        productId: 'prod-headphone-anc',
        name: 'Tai Nghe Chống Ồn Chủ Động Bluetooth Wireless Hi-Res',
        price: 1450000,
        quantity: 1,
        category: 'ELECTRONICS',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=85',
      },
      {
        productId: 'prod-mouse-ultralight',
        name: 'Chuột Gaming Siêu Nhẹ 49g Cảm Biến 26.000 DPI Không Dây',
        price: 990000,
        quantity: 1,
        category: 'ELECTRONICS',
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=85',
      },
    ],
    itemsCount: 2,
    subtotalAmount: 2440000,
    discountAmount: 366000,
    shippingFee: 0,
    finalTotalAmount: 2074000,
    appliedVoucherCode: 'TECH_SUPER_SALE',
    paymentMethod: 'QR_NAPAS',
    deviceEntropy: 'Mozilla/5.0 (iPhone; iOS 17_5) Mobile/Safari',
    clientIp: '14.169.120.55 (Viettel 4G)',
    checkoutVelocitySec: 58.2,
    fulfillmentStatus: 'PACKAGING',
    aiExplanation: {
      riskScore: 12,
      riskLevel: 'LOW',
      decision: 'APPROVED',
      reasons: [
        'Khách chuyển khoản QR Napas247 xác thực sinh trắc học',
        'Lịch sử duyệt hàng tự nhiên 58 giây',
        'Thiết bị di động iPhone chính chủ',
      ],
      summary: 'Đã thanh toán trước 100%. Người bán đang bọc chống sốc đóng gói.',
      modelName: 'gemini-2.5-flash',
      evaluatedAt: '2026-10-13T15:20:48.000Z',
    },
    decryptedPII: {
      customerName: 'Trần Thị Mai',
      phoneNumber: '0912345678',
      deliveryAddress: '128 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      customerEmail: 'mai.tran@gmail.com',
    },
  },
  {
    id: 'ord-seed-03',
    orderCode: 'ORD-2026-VN303',
    createdAt: '2026-10-13T16:40:10.000Z',
    encryptedPII: {
      customerName: {
        ciphertextHex: 'e84ef05a5b40ba044cc62596acd0',
        ivHex: '89f5781237ae5cf1393086b9',
        authTagHex: '8012344eed1d0de05179c2ca6ee3e61e',
      },
      phoneNumber: {
        ciphertextHex: '50e83f374f9ca275af6e',
        ivHex: '3b71e5d2eea9f96547c8172a',
        authTagHex: '12e300dabe6d212d3bfc27101c2ff1d6',
      },
      deliveryAddress: {
        ciphertextHex: '2ff315289cd9bd25534eb064f95460ae6c4e68990228313249e0d88664de53df5add16fedd42721886f440ac42302f0895804477be11211537e0',
        ivHex: 'd026f49d1e0bf215a0aafedd',
        authTagHex: '5440c339139fc889cd132477c911900e',
      },
    },
    phoneBlindIndex: '162690a2179c6ba30455bbc10185d2e508ffd9ea2b8e6886098b8fccb3f8c2f2',
    recordChecksum: '893f8f51008580c13ad0b3b4eafe67bc6a965b58a17c519470aee6007b76c30a',
    items: [
      {
        productId: 'prod-tshirt-unisex',
        name: 'Áo Thun Oversize Unisex 100% Cotton 250gsm Thoáng Mát',
        price: 189000,
        quantity: 2,
        category: 'FASHION',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=85',
      },
      {
        productId: 'prod-backpack-waterproof',
        name: 'Balo Công Nghệ Chống Nước Ngăn Chứa Laptop 15.6 inch',
        price: 450000,
        quantity: 1,
        category: 'FASHION',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85',
      },
    ],
    itemsCount: 3,
    subtotalAmount: 828000,
    discountAmount: 30000,
    shippingFee: 0,
    finalTotalAmount: 798000,
    appliedVoucherCode: 'FREESHIP_MAX',
    paymentMethod: 'COD',
    deviceEntropy: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    clientIp: '42.112.35.80 (FPT Telecom)',
    checkoutVelocitySec: 36.4,
    fulfillmentStatus: 'IN_TRANSIT',
    aiExplanation: {
      riskScore: 8,
      riskLevel: 'LOW',
      decision: 'APPROVED',
      reasons: [
        'Hành vi người mua bình thường',
        'Địa chỉ nhận hàng rõ ràng tại TP.HCM',
        'Phương thức thanh toán COD hợp lệ',
      ],
      summary: 'Đã bàn giao cho đơn vị vận chuyển SPX Express giao hỏa tốc.',
      modelName: 'gemini-2.5-flash',
      evaluatedAt: '2026-10-13T16:40:12.000Z',
    },
    decryptedPII: {
      customerName: 'Lê Hoàng Nam',
      phoneNumber: '0977665544',
      deliveryAddress: '88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      customerEmail: 'nam.le@gmail.com',
    },
  },
  {
    id: 'ord-seed-04',
    orderCode: 'ORD-2026-HACK99',
    createdAt: '2026-10-13T17:10:05.000Z',
    encryptedPII: {
      customerName: {
        ciphertextHex: 'e5711469f1222fbee198fa768b',
        ivHex: '69c6028f3676549da2d637e4',
        authTagHex: '9dcd193ed7574d7fbd5c2886e767b833',
      },
      phoneNumber: {
        ciphertextHex: '8dbcea64db66879b7c4a',
        ivHex: 'ba0bf8382972da74faffe9d9',
        authTagHex: '3b355e17a1468df71c25530c9d665c8d',
      },
      deliveryAddress: {
        ciphertextHex: '6dc4089c153e728f631251844cd7a5408101ba45e8b3ba2d041ada657163562a7110002573448e380d5f470e15dd7830e16daf071cff9f713647a7',
        ivHex: '28f303c2784385ca2ed4e3d7',
        authTagHex: '8e9221eda09e6c9d90ea6cf732533674',
      },
      cardNumber: {
        ciphertextHex: 'f96ae0cc8a48c1d2f797fae3447906eb',
        ivHex: '69aa1aec1ad685262c3efd5e',
        authTagHex: '95e72805c8e648932a09de6f0445b17f',
      },
    },
    phoneBlindIndex: '54f6e28fc4021da113126c5f578f5b3d6889785d3831cae3c76b1d8d6569e63b',
    recordChecksum: '759d10b27a01148d0574a78114bdb5b398a7e59e06ab49ff8621f559ad64ee32',
    items: [
      {
        productId: 'prod-laptop-gaming',
        name: 'Laptop Gaming RTX 4050 16GB 512GB (Chính Hãng)',
        price: 24990000,
        quantity: 2,
        category: 'ELECTRONICS',
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=85',
      },
    ],
    itemsCount: 2,
    subtotalAmount: 49980000,
    discountAmount: 20000000,
    shippingFee: 0,
    finalTotalAmount: 29980000,
    appliedVoucherCode: 'VOUCHER_HACK_90',
    paymentMethod: 'CREDIT_CARD',
    deviceEntropy: 'HeadlessChrome/119.0 (Linux x86_64) Puppeteer/Automation',
    clientIp: '194.26.29.112 (Proxy/Datacenter NL)',
    checkoutVelocitySec: 1.1,
    fulfillmentStatus: 'HOLD_REVIEW',
    aiExplanation: {
      riskScore: 94,
      riskLevel: 'HIGH',
      decision: 'HOLD_REVIEW',
      reasons: [
        'Tốc độ thanh toán siêu tốc 1.1s đặc trưng của Botnet tự động',
        'Áp dụng mã giảm giá lỗ hổng rò rỉ (VOUCHER_HACK_90)',
        'Email sử dụng dịch vụ mail rác bot_farmer_88@tempmail.io',
        'Dấu vân tay Headless Chrome xuất phát từ dải IP Proxy nước ngoài',
      ],
      summary: 'Tấn công Botnet đầu cơ mã giảm giá & thử thẻ tín dụng đánh cắp. Đã cách ly đơn hàng.',
      modelName: 'gemini-2.5-flash',
      evaluatedAt: '2026-10-13T17:10:08.000Z',
    },
    decryptedPII: {
      customerName: 'Tran Hack Bot',
      phoneNumber: '0988888888',
      deliveryAddress: 'Bãi đất trống KCN Sóng Thần, Dĩ An, Bình Dương',
      customerEmail: 'bot_farmer_88@tempmail.io',
      cardNumber: '4111222233334444',
    },
  },
]

export const SecurityOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<EncryptedOrder[]>(INITIAL_ORDERS_SEED)
  const [viewMode, setViewMode] = useState<'STOREFRONT' | 'ADMIN'>('STOREFRONT')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('gemini-2.5-flash')
  const [isAuthorizedDecrypted, setIsAuthorizedDecrypted] = useState(false)

  // Modals state
  const [isCryptoVisualizerOpen, setIsCryptoVisualizerOpen] = useState(false)
  const [selectedOrderForCrypto, setSelectedOrderForCrypto] = useState<EncryptedOrder | null>(null)
  const [isXaiModalOpen, setIsXaiModalOpen] = useState(false)
  const [selectedOrderForXai, setSelectedOrderForXai] = useState<EncryptedOrder | null>(null)
  const [isTamperAlertOpen, setIsTamperAlertOpen] = useState(false)
  const [tamperAlertDetails, setTamperAlertDetails] = useState<{
    orderCode: string
    report: IntegrityReport
  } | null>(null)

  // Toast state
  const [toast, setToast] = useState<{
    type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO'
    title: string
    message: string
  } | null>(null)

  const showToast = (type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO', title: string, message: string) => {
    setToast({ type, title, message })
  }

  const hideToast = () => {
    setToast(null)
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Load saved orders from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('GROUP9_ORDERS_STORAGE')
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders)
          // If stored orders still contain the broken placeholder hash, upgrade them
          const hasBrokenSeed = Array.isArray(parsed) && parsed.some(
            (o: EncryptedOrder) =>
              o.phoneBlindIndex === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' ||
              o.phoneBlindIndex === '9c5e31c890123456789abcdef0123456789abcdef0123456789abcdef01234567'
          )
          if (Array.isArray(parsed) && parsed.length > 0 && !hasBrokenSeed) {
            setOrders(parsed)
          } else {
            setOrders(INITIAL_ORDERS_SEED)
            localStorage.setItem('GROUP9_ORDERS_STORAGE', JSON.stringify(INITIAL_ORDERS_SEED))
          }
        } catch (e) {
          console.error('Failed to load orders from storage', e)
        }
      }
    }
  }, [])

  // Sync orders to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined' && orders.length > 0) {
      localStorage.setItem('GROUP9_ORDERS_STORAGE', JSON.stringify(orders))
    }
  }, [orders])

  // Load API key from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('GEMINI_API_KEY') || ''
      if (savedKey) setApiKey(savedKey)
      const savedModel = localStorage.getItem('GEMINI_MODEL_NAME') || 'gemini-2.5-flash'
      // Tự động nâng cấp các model 1.5 cũ đã bị Google đóng sang Gemini 2.5 Flash
      const normalizedModel =
        savedModel === 'gemini-1.5-pro' || savedModel === 'gemini-1.5-flash' || savedModel === 'gemini-1.0-pro'
          ? 'gemini-2.5-flash'
          : savedModel
      setModelName(normalizedModel)
      localStorage.setItem('GEMINI_MODEL_NAME', normalizedModel)
    }
  }, [])

  const saveApiKey = (key: string) => {
    setApiKey(key)
    if (typeof window !== 'undefined') {
      localStorage.setItem('VITE_GEMINI_API_KEY', key)
      localStorage.setItem('GEMINI_API_KEY', key)
    }
    showToast('SUCCESS', 'Đã lưu cấu hình API', 'Gemini API Key đã được cập nhật thành công!')
  }

  const saveModelName = (model: string) => {
    setModelName(model)
    if (typeof window !== 'undefined') {
      localStorage.setItem('GEMINI_MODEL_NAME', model)
    }
  }

  const toggleAuthorizedDecrypt = () => {
    setIsAuthorizedDecrypted((prev) => {
      const next = !prev
      if (next) {
        showToast('SUCCESS', 'Giải mã thẩm quyền', 'Đã giải mã các trường AES-256-GCM sang bản rõ')
      } else {
        showToast('WARNING', 'Khóa dữ liệu', 'Đã ẩn bản rõ và hiển thị chuỗi hex mã hóa an toàn')
      }
      return next
    })
  }

  // Create and encrypt new order
  const createAndEncryptOrder = async (params: {
    pii: CustomerPII
    items: OrderItemSummary[]
    subtotalAmount: number
    discountAmount: number
    shippingFee: number
    finalTotalAmount: number
    appliedVoucherCode?: string
    paymentMethod: PaymentMethod
    telemetry: FraudEvaluationPayload
    aiExplanation: AIExplanation
  }): Promise<EncryptedOrder> => {
    const orderCode = generateOrderId()

    // Encrypt Customer PII via Web Crypto API (AES-256-GCM)
    const encryptedPII = await encryptOrderPII(params.pii)

    // Compute Blind Index via HMAC-SHA256
    const phoneBlindIndex = await computeBlindIndex(params.pii.phoneNumber)

    // Compute Record Checksum via SHA-256
    const recordChecksum = await computeRecordChecksum({
      orderCode,
      encryptedPII,
      phoneBlindIndex,
      finalTotalAmount: params.finalTotalAmount,
    })

    const initialStatus: FulfillmentStatus =
      params.aiExplanation.decision === 'HOLD_REVIEW'
        ? 'HOLD_REVIEW'
        : 'PAID_APPROVED'

    const newOrder: EncryptedOrder = {
      id: `ord-${Date.now()}`,
      orderCode,
      createdAt: new Date().toISOString(),
      encryptedPII,
      phoneBlindIndex,
      recordChecksum,
      items: params.items,
      itemsCount: params.items.reduce((s, i) => s + i.quantity, 0),
      subtotalAmount: params.subtotalAmount,
      discountAmount: params.discountAmount,
      shippingFee: params.shippingFee,
      finalTotalAmount: params.finalTotalAmount,
      appliedVoucherCode: params.appliedVoucherCode,
      paymentMethod: params.paymentMethod,
      deviceEntropy: params.telemetry.deviceEntropy,
      clientIp: params.telemetry.clientIp,
      checkoutVelocitySec: params.telemetry.checkoutVelocitySec,
      aiExplanation: params.aiExplanation,
      fulfillmentStatus: initialStatus,
      decryptedPII: params.pii,
    }

    setOrders((prev) => [newOrder, ...prev])

    // Đồng bộ lên bảng public.orders của CSDL Supabase (Lưu 100% bản mã, không có PII bản rõ)
    try {
      const supabase = createClient()
      supabase
        .from('orders')
        .upsert({
          id: newOrder.id,
          order_code: newOrder.orderCode,
          encrypted_pii: newOrder.encryptedPII as any,
          phone_blind_index: newOrder.phoneBlindIndex,
          record_checksum: newOrder.recordChecksum,
          items: newOrder.items as any,
          items_count: newOrder.itemsCount,
          subtotal_amount: newOrder.subtotalAmount,
          discount_amount: newOrder.discountAmount,
          shipping_fee: newOrder.shippingFee,
          final_total_amount: newOrder.finalTotalAmount,
          applied_voucher_code: newOrder.appliedVoucherCode || null,
          payment_method: newOrder.paymentMethod as any,
          device_entropy: newOrder.deviceEntropy || null,
          client_ip: newOrder.clientIp || null,
          checkout_velocity_sec: newOrder.checkoutVelocitySec,
          ai_explanation: newOrder.aiExplanation as any,
          fulfillment_status: newOrder.fulfillmentStatus as any,
          is_tampered: false,
          created_at: newOrder.createdAt,
          updated_at: newOrder.createdAt,
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase orders sync info:', error.message)
        })
    } catch (dbErr) {
      console.warn('Supabase orders table error:', dbErr)
    }

    showToast(
      params.aiExplanation.decision === 'HOLD_REVIEW' ? 'DANGER' : 'SUCCESS',
      `Đơn hàng ${orderCode}`,
      params.aiExplanation.decision === 'HOLD_REVIEW'
        ? `Phát hiện rủi ro cao (${params.aiExplanation.riskScore}đ). Đã chuyển cách ly!`
        : `Mã hóa AES-256-GCM thành công & Đã duyệt thanh toán!`
    )
    return newOrder
  }

  // Update fulfillment status
  const updateFulfillmentStatus = (orderId: string, status: FulfillmentStatus) => {
    const target = orders.find((o) => o.id === orderId)
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, fulfillmentStatus: status } : ord))
    )

    try {
      const supabase = createClient()
      supabase.from('orders').update({ fulfillment_status: status as any }).eq('id', orderId).then()
    } catch {}

    if (target) {
      const labels: Record<FulfillmentStatus, string> = {
        PAID_APPROVED: 'Đã duyệt thanh toán',
        PACKAGING: 'Đang đóng gói chống sốc',
        IN_TRANSIT: 'Đang vận chuyển (SPX Express)',
        DELIVERED: 'Giao hàng thành công',
        HOLD_REVIEW: 'Tạm giữ thẩm định',
        CANCELLED: 'Đã hủy & Khóa',
      }
      showToast('SUCCESS', `Đơn hàng ${target.orderCode}`, `Trạng thái mới: ${labels[status]}`)
    }
  }

  // Simulate DB tampering (alter 1 byte in ciphertext)
  const simulateTamper = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId)
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? simulateTamperCiphertext(ord) : ord))
    )
    if (target) {
      showToast('WARNING', 'Mô phỏng tấn công CSDL', `Đã sửa đổi 1 byte trong Ciphertext của đơn ${target.orderCode}`)
    }
  }

  // Restore tampered order
  const restoreTampered = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId)
    if (!target || !target.decryptedPII) return

    const restored = await restoreTamperedOrder(target, target.decryptedPII)
    setOrders((prev) => prev.map((ord) => (ord.id === orderId ? restored : ord)))
    showToast('SUCCESS', 'Khôi phục toàn vẹn', `Đã khôi phục dữ liệu hợp lệ cho đơn hàng ${target.orderCode}`)
  }

  // Verify integrity
  const verifyIntegrity = async (orderId: string): Promise<IntegrityReport> => {
    const target = orders.find((o) => o.id === orderId)
    if (!target) {
      return {
        isValid: false,
        checksumMatches: false,
        gmacValid: false,
        errorDetails: 'Không tìm thấy đơn hàng!',
      }
    }

    const report = await verifyOrderIntegrity(target)

    if (!report.isValid) {
      setTamperAlertDetails({
        orderCode: target.orderCode,
        report,
      })
      setIsTamperAlertOpen(true)
      showToast('DANGER', 'Cảnh báo toàn vẹn', `Đơn hàng ${target.orderCode} bị can thiệp trái phép!`)
    } else {
      showToast('SUCCESS', 'Xác thực toàn vẹn', `Đơn hàng ${target.orderCode} toàn vẹn 100% (GMAC & Checksum hợp lệ)`)
    }

    return report
  }

  // Reset database to default seed
  const resetDatabaseToDefault = () => {
    setOrders(INITIAL_ORDERS_SEED)
    if (typeof window !== 'undefined') {
      localStorage.setItem('GROUP9_ORDERS_STORAGE', JSON.stringify(INITIAL_ORDERS_SEED))
    }
    showToast('SUCCESS', 'Đã đặt lại CSDL', 'Dữ liệu CSDL đã được đưa về trạng thái mẫu ban đầu.')
  }

  return (
    <SecurityOrderContext.Provider
      value={{
        orders,
        viewMode,
        setViewMode,
        apiKey,
        setApiKey: saveApiKey,
        modelName,
        setModelName: saveModelName,
        isAuthorizedDecrypted,
        toggleAuthorizedDecrypt,
        isCryptoVisualizerOpen,
        setIsCryptoVisualizerOpen,
        selectedOrderForCrypto,
        setSelectedOrderForCrypto,
        isXaiModalOpen,
        setIsXaiModalOpen,
        selectedOrderForXai,
        setSelectedOrderForXai,
        isTamperAlertOpen,
        setIsTamperAlertOpen,
        tamperAlertDetails,
        toast,
        showToast,
        hideToast,
        createAndEncryptOrder,
        updateFulfillmentStatus,
        simulateTamper,
        restoreTampered,
        verifyIntegrity,
        resetDatabaseToDefault,
      }}
    >
      {children}
    </SecurityOrderContext.Provider>
  )
}

export const useSecurityOrder = () => {
  const context = useContext(SecurityOrderContext)
  if (!context) {
    throw new Error('useSecurityOrder must be used within a SecurityOrderProvider')
  }
  return context
}
