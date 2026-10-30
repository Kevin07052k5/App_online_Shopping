'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  ShieldAlert,
  Sparkles,
  FlaskConical,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Fingerprint,
  Scan,
  Camera,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from 'lucide-react'
import { useMarketplace } from '@/src/context/MarketplaceContext'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { useAuth } from '@/src/context/AuthContext'
import { CustomerPII, OrderItemSummary, PaymentMethod } from '@/src/types/order'
import { FraudEvaluationPayload } from '@/src/types/fraud'
import { analyzeOrderFraud } from '@/src/services/geminiAiService'
import { formatVND, generateOrderId } from '@/src/utils/helpers'
import { FaceBiometricModal } from '@/src/components/biometric/FaceBiometricModal'
import { BiometricVerificationResult } from '@/src/types/biometric'
import {
  GoogleMapAddressPickerModal,
  MapCoordinates,
} from '@/src/components/common/GoogleMapAddressPickerModal'

export function CheckoutModal() {
  const {
    cart,
    subtotal,
    discountAmount,
    shippingFee,
    finalTotal,
    appliedVoucher,
    applyVoucher,
    setCartItems,
    products,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    setIsOtpModalOpen,
    setPendingCheckoutPayload,
    clearCart,
  } = useMarketplace()

  const {
    apiKey,
    modelName,
    createAndEncryptOrder,
    setSelectedOrderForCrypto,
    setIsCryptoVisualizerOpen,
    setViewMode,
    showToast,
  } = useSecurityOrder()

  const { currentUser, updateProfile } = useAuth()
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [deliveryCoords, setDeliveryCoords] = useState<MapCoordinates>({
    lat: 10.801344,
    lng: 106.714365,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false)
  const [biometricResult, setBiometricResult] = useState<BiometricVerificationResult | null>(null)
  const [requireFaceId, setRequireFaceId] = useState<boolean>(true)

  // Customer Form Data
  const [formData, setFormData] = useState<CustomerPII>({
    customerName: 'Nguyễn Văn An',
    phoneNumber: '0908123456',
    deliveryAddress: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
    customerEmail: 'an.nguyen@gmail.com',
    cardNumber: '9704229988776655',
  })

  // Auto-prefill if user is logged in
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        customerName: currentUser.name || prev.customerName,
        customerEmail: currentUser.email || prev.customerEmail,
        phoneNumber: currentUser.phoneNumber || prev.phoneNumber,
        deliveryAddress: currentUser.address || prev.deliveryAddress,
      }))
    }
  }, [currentUser, isCheckoutModalOpen])

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')

  // Telemetry metadata for fraud evaluation
  const [clientIp, setClientIp] = useState('113.161.45.12 (VNPT TP.HCM)')
  const [deviceEntropy, setDeviceEntropy] = useState(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
  )
  const [checkoutVelocitySec, setCheckoutVelocitySec] = useState(42.5)

  if (!isCheckoutModalOpen) return null

  // =========================================================================
  // 3 PRESET DEMO BUTTONS FOR THESIS DEFENSE (HỘI ĐỒNG CHẤM THI)
  // =========================================================================
  const handlePreset1Legit = () => {
    // Kịch bản 1: Mua 1 Bàn phím cơ, áp freeship, COD, info rõ ràng -> LOW RISK (5-15)
    const keyboard = products.find((p) => p.id === 'prod-keyboard-rapid')!
    setCartItems([{ product: keyboard, quantity: 1 }])
    applyVoucher('FREESHIP_MAX')

    setFormData({
      customerName: 'Nguyễn Văn An',
      phoneNumber: '0908123456',
      deliveryAddress: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
      customerEmail: 'an.nguyen@gmail.com',
    })
    setPaymentMethod('COD')
    setClientIp('113.161.45.12 (VNPT TP.HCM)')
    setDeviceEntropy('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0')
    setCheckoutVelocitySec(42.5)
    setBiometricResult(null)
  }

  const handlePreset2CardSuspicious = () => {
    // Kịch bản 2: Mua Laptop Gaming 25tr bằng Thẻ tín dụng, IP lạ -> MEDIUM RISK (45-65) -> CHALLENGE_OTP
    const laptop = products.find((p) => p.id === 'prod-laptop-gaming')!
    setCartItems([{ product: laptop, quantity: 1 }])
    applyVoucher('TECH_SUPER_SALE')

    setFormData({
      customerName: 'Trần Minh Quân',
      phoneNumber: '0912345678',
      deliveryAddress: '15 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
      customerEmail: 'quan.tran88@outlook.com',
      cardNumber: '4111222233334444',
    })
    setPaymentMethod('CREDIT_CARD')
    setClientIp('185.220.101.5 (Proxy/Datacenter NL)')
    setDeviceEntropy('Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/125.0')
    setCheckoutVelocitySec(8.2)
    setBiometricResult(null)
  }

  const handlePreset3BotExploit = () => {
    // Kịch bản 3: Tài khoản tempmail, áp voucher 90%, checkout 0.8s -> HIGH RISK (88-98) -> HOLD_REVIEW
    const laptop = products.find((p) => p.id === 'prod-laptop-gaming')!
    const headphone = products.find((p) => p.id === 'prod-headphone-anc')!
    setCartItems([
      { product: laptop, quantity: 1 },
      { product: headphone, quantity: 2 },
    ])
    applyVoucher('VOUCHER_HACK_90')

    setFormData({
      customerName: 'bot_farmer_sqli_null',
      phoneNumber: '0000000000',
      deliveryAddress: 'Bãi đất trống KCN Sóng Thần, Dĩ An, Bình Dương',
      customerEmail: 'bot_farmer_88@tempmail.io',
      cardNumber: '5500000011112222',
    })
    setPaymentMethod('CREDIT_CARD')
    setClientIp('194.26.29.112 (Proxy/Datacenter NL)')
    setDeviceEntropy('Headless Chrome / Linux x86_64 Automation')
    setCheckoutVelocitySec(0.8)
    setBiometricResult(null)
  }

  // =========================================================================
  // FORM VALIDATION & ORDER EXECUTION (INTEGRATED WITH FACE ID & AI)
  // =========================================================================
  const validateCheckoutForm = (): boolean => {
    if (cart.length === 0) {
      showToast('WARNING', 'Giỏ hàng trống', 'Vui lòng chọn sản phẩm trước khi thanh toán.')
      return false
    }

    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      showToast('WARNING', 'Thiếu thông tin', 'Vui lòng nhập họ và tên người nhận hợp lệ.')
      return false
    }

    const cleanPhone = formData.phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      showToast('WARNING', 'SĐT không hợp lệ', 'Vui lòng nhập số điện thoại nhận hàng hợp lệ (9 - 11 chữ số).')
      return false
    }

    if (!formData.customerEmail.trim() || !formData.customerEmail.includes('@')) {
      showToast('WARNING', 'Email không hợp lệ', 'Vui lòng nhập địa chỉ email hợp lệ để nhận hóa đơn.')
      return false
    }

    if (!formData.deliveryAddress.trim() || formData.deliveryAddress.trim().length < 5) {
      showToast('WARNING', 'Địa chỉ quá ngắn', 'Vui lòng nhập địa chỉ giao hàng cụ thể (tối thiểu 5 ký tự).')
      return false
    }

    if (paymentMethod === 'CREDIT_CARD') {
      const cleanCard = (formData.cardNumber || '').replace(/\D/g, '')
      if (cleanCard.length < 15 || cleanCard.length > 19) {
        showToast('WARNING', 'Số thẻ không hợp lệ', 'Vui lòng nhập số thẻ tín dụng hợp lệ (15 - 19 chữ số).')
        return false
      }
    }

    return true
  }

  const executeOrderPlacement = async (verifiedBiometrics?: BiometricVerificationResult | null) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const tempOrderId = generateOrderId()

    const telemetryPayload: FraudEvaluationPayload = {
      orderId: tempOrderId,
      totalAmount: finalTotal,
      discountAmount,
      voucherCode: appliedVoucher?.code,
      itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
      paymentMethod,
      deviceEntropy,
      clientIp,
      checkoutVelocitySec,
      customerEmail: formData.customerEmail,
      shippingAddress: formData.deliveryAddress,
      biometricVerification: verifiedBiometrics
        ? {
            verified: verifiedBiometrics.success,
            status: verifiedBiometrics.status === 'MATCHED' ? 'MATCH' : (verifiedBiometrics.status as any),
            cosineSimilarity: verifiedBiometrics.cosineSimilarity,
            livenessPassed: verifiedBiometrics.livenessScore >= 50,
            matchedProfileName: verifiedBiometrics.matchedProfile?.name || formData.customerName,
          }
        : undefined,
    }

    try {
      // 1. Invoke Gemini AI or Heuristic Fallback
      const aiResult = await analyzeOrderFraud(telemetryPayload, apiKey, modelName)

      // Map cart items to summary
      const itemsSummary: OrderItemSummary[] = cart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        category: i.product.category,
        image: i.product.image,
      }))

      // 2. Adaptive UX based on decision
      if (aiResult.decision === 'CHALLENGE_OTP') {
        // Trigger OTP Modal
        setPendingCheckoutPayload({
          pii: formData,
          telemetry: telemetryPayload,
        })
        setIsCheckoutModalOpen(false)
        setIsOtpModalOpen(true)
        return
      }

      // If APPROVED or HOLD_REVIEW -> Proceed to Web Crypto Encryption
      const createdOrder = await createAndEncryptOrder({
        pii: formData,
        items: itemsSummary,
        subtotalAmount: subtotal,
        discountAmount,
        shippingFee,
        finalTotalAmount: finalTotal,
        appliedVoucherCode: appliedVoucher?.code,
        paymentMethod,
        telemetry: telemetryPayload,
        aiExplanation: aiResult,
      })

      clearCart()
      setIsCheckoutModalOpen(false)

      if (aiResult.decision === 'APPROVED') {
        // Open Crypto Visualizer Modal to show the thesis council how AES-256-GCM encrypted the PII!
        setSelectedOrderForCrypto(createdOrder)
        setIsCryptoVisualizerOpen(true)
      } else {
        // HOLD_REVIEW -> Inform the user and guide them to Admin Hub
        alert(
          `🚨 CẢNH BÁO AN NINH AI:\nĐơn hàng ${createdOrder.orderCode} có điểm rủi ro cao (${aiResult.riskScore}/100 - HIGH RISK).\nLý do: ${aiResult.reasons[0]}\n\nĐơn hàng đã được chuyển vào "Hàng Đợi Kiểm Duyệt" trong Trang Quản Trị!`
        )
        setViewMode('ADMIN')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      alert(`Đã xảy ra lỗi khi xử lý thanh toán: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCheckoutForm()) return

    // KIỂM TRA BẮT BUỘC FACE ID: Nếu người dùng chưa quét Face ID chính chủ
    if (requireFaceId && (!biometricResult || !biometricResult.success)) {
      showToast(
        'INFO',
        'Xác Thực Face ID Chính Chủ',
        'Vui lòng quét khuôn mặt để xác nhận bạn là chính chủ tài khoản trước khi hoàn tất đặt hàng!'
      )
      setIsBiometricModalOpen(true)
      return
    }

    await executeOrderPlacement(biometricResult)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-[#ee4d2d] text-white">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>Xác Nhận Thanh Toán &amp; Đặt Hàng</span>
            </h3>
            <p className="text-xs text-orange-100">
              Mô hình TMĐT tích hợp AI Fraud Prevention &amp; AES-256-GCM
            </p>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 3 Preset Buttons for Defense Council */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <FlaskConical className="size-3.5 text-amber-700" />
              KỊCH BẢN THỬ NGHIỆM HỘI ĐỒNG (1-CLICK DEMO PRESETS):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handlePreset1Legit}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95 text-center"
            >
              <span>🧪 1. Hợp Lệ (Low Risk)</span>
            </button>

            <button
              type="button"
              onClick={handlePreset2CardSuspicious}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition active:scale-95 text-center"
            >
              <span>⚠️ 2. Thẻ Lạ (OTP Test)</span>
            </button>

            <button
              type="button"
              onClick={handlePreset3BotExploit}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition active:scale-95 text-center"
            >
              <span>🚨 3. Botnet (High Risk)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form
          id="checkout-submission-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
        >
          {/* Order Summary Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block">Sản phẩm trong đơn:</span>
              <span className="font-bold text-slate-900 text-xs">
                {cart.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Tổng tiền sau voucher:</span>
              <span className="text-base font-black text-[#ee4d2d] font-mono">
                {formatVND(finalTotal)}
              </span>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Thông Tin Nhận Hàng (PII sẽ được mã hóa AES-256-GCM)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#ee4d2d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-[#ee4d2d] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email nhận hóa đơn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#ee4d2d] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Địa chỉ giao hàng chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#ee4d2d] hover:text-[#d73211] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 transition cursor-pointer"
                  >
                    <MapPin className="size-3 text-[#ee4d2d]" />
                    <span>Chọn Trên Google Map</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#ee4d2d] focus:outline-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-[#ee4d2d] transition cursor-pointer"
                    title="Mở Google Maps chọn địa chỉ"
                  >
                    <MapPin className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Phương Thức Thanh Toán
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 border text-center transition ${
                  paymentMethod === 'COD'
                    ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d] font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="size-4" />
                <span className="text-[10px]">Tiền mặt COD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QR_NAPAS')}
                className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 border text-center transition ${
                  paymentMethod === 'QR_NAPAS'
                    ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d] font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="size-4" />
                <span className="text-[10px]">QR Napas247</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 border text-center transition ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d] font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="size-4" />
                <span className="text-[10px]">Thẻ Tín Dụng</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('E_WALLET')}
                className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 border text-center transition ${
                  paymentMethod === 'E_WALLET'
                    ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d] font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wallet className="size-4" />
                <span className="text-[10px]">Ví Group 9 Pay</span>
              </button>
            </div>
          </div>

          {/* Face ID Biometric Verification Card (Chính Chủ Đặt Hàng) */}
          <div
            className={`rounded-2xl border p-4 transition-all duration-200 ${
              biometricResult?.success
                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 shadow-sm'
                : 'border-orange-200 bg-gradient-to-r from-orange-50/90 to-amber-50/90 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-2xl shrink-0 ${
                    biometricResult?.success
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-[#ee4d2d] text-white shadow-sm animate-pulse'
                  }`}
                >
                  {biometricResult?.success ? (
                    <ShieldCheck className="size-5" />
                  ) : (
                    <Scan className="size-5" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Xác Thực Face ID Chính Chủ (SFace Biometrics)
                    </h4>
                    {biometricResult?.success ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle className="size-3" /> ĐÃ XÁC NHẬN CHÍNH CHỦ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#ee4d2d] border border-orange-200">
                        <AlertTriangle className="size-3" /> BẮT BUỘC ĐỂ ĐẶT HÀNG
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {biometricResult?.success
                      ? `Chủ tài khoản: ${biometricResult.matchedProfile?.name || formData.customerName} • Độ tương đồng: ${Math.round(biometricResult.cosineSimilarity * 100)}% • Liveness: Sống động tự nhiên`
                      : `Hệ thống yêu cầu quét Face ID của ${currentUser?.name || formData.customerName} để chứng minh bạn là chính chủ đang đặt hàng, ngăn chặn kẻ gian chiếm đoạt tài khoản.`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {biometricResult?.success ? (
                  <button
                    type="button"
                    onClick={() => setIsBiometricModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Quét Lại Face ID</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateCheckoutForm()) return
                      setIsBiometricModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#ee4d2d] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/30 hover:bg-[#d94124] transition active:scale-95"
                  >
                    <Camera className="size-4" />
                    <span>Quét Face ID Ngay</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-200/70 text-[11px] gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={requireFaceId}
                  onChange={(e) => setRequireFaceId(e.target.checked)}
                  className="rounded text-[#ee4d2d] focus:ring-[#ee4d2d] size-3.5"
                />
                <span>Bắt buộc xác thực Face ID chính chủ trước khi tạo đơn hàng</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                AI ONNX 128-D Anti-Spoofing
              </span>
            </div>
          </div>

          {/* Telemetry Payload Inspector (Explainable AI Features) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="size-3.5" />
                Transaction Telemetry (Đầu vào mô hình Gemini AI):
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                Tốc độ: {checkoutVelocitySec}s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1 truncate">
                <Globe className="size-3 text-cyan-400" />
                <span>Client IP: <strong className="text-white">{clientIp}</strong></span>
              </div>
              <div className="flex items-center gap-1 truncate">
                <Clock className="size-3 text-cyan-400" />
                <span>Voucher: <strong className="text-amber-300">{appliedVoucher?.code || 'None'}</strong></span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-slate-400 truncate">
              User-Agent: {deviceEntropy}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 p-5 bg-white flex items-center justify-between gap-4">
          <div className="text-xs">
            <span className="text-slate-500 block">Tổng số tiền cần thanh toán:</span>
            <span className="text-lg font-black text-[#ee4d2d] font-mono">
              {formatVND(finalTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="rounded-2xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Quay Lại
            </button>

            <button
              type="submit"
              form="checkout-submission-form"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50 ${
                requireFaceId && (!biometricResult || !biometricResult.success)
                  ? 'bg-gradient-to-r from-[#ee4d2d] to-orange-600 shadow-orange-600/30 hover:brightness-105'
                  : 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="size-4 animate-spin text-amber-300" />
                  <span>Gemini AI Đang Phân Tích...</span>
                </>
              ) : requireFaceId && (!biometricResult || !biometricResult.success) ? (
                <>
                  <Scan className="size-4 text-orange-200" />
                  <span>Xác Thực Face ID &amp; Đặt Hàng</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4 text-emerald-200" />
                  <span>Hoàn Tất Đặt Hàng (Đã Xác Thực Chính Chủ)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SFace Face Biometric Modal */}
      <FaceBiometricModal
        isOpen={isBiometricModalOpen}
        title="Xác Thực Face ID Chính Chủ Đặt Hàng"
        subtitle={`Đối chiếu khuôn mặt trực tiếp với chủ tài khoản ${currentUser?.name || formData.customerName} bằng AI SFace ONNX`}
        targetRole="CUSTOMER"
        onVerified={async (biometricRes) => {
          setIsBiometricModalOpen(false)
          if (biometricRes.success) {
            setBiometricResult(biometricRes)
            showToast(
              'SUCCESS',
              'Xác Thực Thành Công',
              `Đã xác nhận chính chủ ${biometricRes.matchedProfile?.name || formData.customerName} (${Math.round(biometricRes.cosineSimilarity * 100)}% khớp). Đang tiến hành tạo đơn hàng và mã hóa AES-256...`
            )
            // Tự động tiến hành tạo đơn hàng và mã hóa PII ngay lập tức sau khi quét Face ID thành công
            await executeOrderPlacement(biometricRes)
          } else {
            setBiometricResult(null)
            showToast(
              'DANGER',
              'Từ Chối Xác Thực',
              biometricRes.details || 'Khuôn mặt không trùng khớp với chủ tài khoản. Đơn hàng bị chặn!'
            )
          }
        }}
        onCancel={() => setIsBiometricModalOpen(false)}
      />

      {/* Modal Chọn Địa Chỉ Google Maps */}
      <GoogleMapAddressPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialAddress={formData.deliveryAddress}
        initialCoords={deliveryCoords}
        title="Chọn Vị Trí Giao Hàng Trên Google Maps"
        showSaveAsDefaultOption={!!currentUser}
        onSaveAsDefault={async (selectedAddr) => {
          if (currentUser) {
            await updateProfile({ address: selectedAddr })
            showToast('SUCCESS', 'Đã lưu mặc định', 'Đã lưu địa chỉ này làm địa chỉ nhận hàng mặc định!')
          }
        }}
        onSelectAddress={(selectedAddr, coords) => {
          setFormData((prev) => ({ ...prev, deliveryAddress: selectedAddr }))
          if (coords) setDeliveryCoords(coords)
          showToast('SUCCESS', 'Đã định vị thành công', 'Địa chỉ giao hàng đã được cập nhật từ Google Maps!')
        }}
      />
    </div>
  )
}
