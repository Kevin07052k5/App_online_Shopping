'use client'

import { useState } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  QrCode,
  Banknote,
  Leaf,
  Star,
  MapPin,
  Clock,
  FlaskConical,
  Bot,
  Flame,
  X,
} from 'lucide-react'
import {
  CartItem,
  CustomerFormData,
  PaymentMethod,
  Product,
  TransactionPayload,
} from '@/lib/types'
import { SAMPLE_PRODUCTS } from '@/lib/mock-data'

interface StorefrontViewProps {
  cart: CartItem[]
  onAddToCart: (product: Product, quantity?: number) => void
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemoveFromCart: (productId: string) => void
  onClearCart: () => void
  onSetCartItems: (items: CartItem[]) => void
  onCheckoutSubmit: (formData: CustomerFormData, payload: TransactionPayload) => void
  isProcessing: boolean
  onOpenAdmin: () => void
}

export function StorefrontView({
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onSetCartItems,
  onCheckoutSubmit,
  isProcessing,
  onOpenAdmin,
}: StorefrontViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL')
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_name: '',
    phone: '',
    email: '',
    shipping_address: '',
    payment_method: 'COD',
  })

  // Simulated metadata for fraud detector
  const [clientIp, setClientIp] = useState('113.161.45.12')
  const [ipCountry, setIpCountry] = useState('VN')
  const [deviceFingerprint, setDeviceFingerprint] = useState(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36'
  )
  const [cartDurationSeconds, setCartDurationSeconds] = useState(45)

  // Cart totals
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filter products
  const filteredProducts = SAMPLE_PRODUCTS.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.origin.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedOrigin === 'ALL') return matchesSearch
    if (selectedOrigin === 'VN') return matchesSearch && prod.origin.includes('Việt Nam')
    if (selectedOrigin === 'IMPORT') return matchesSearch && !prod.origin.includes('Việt Nam')
    return matchesSearch
  })

  // 3 Demo Presets for Thesis Defense (Chuẩn đề cương bảo vệ đồ án)
  const applyPreset1Valid = () => {
    // 🧪 Kịch bản 1: Đơn hàng Hợp lệ:
    // Tự động điền "Nguyễn Văn An", SĐT "0908123456", Địa chỉ "475A Điện Biên Phủ, Bình Thạnh", Email "an.nguyen@gmail.com", giá trị ~250.000đ, IP VN
    const taoXanh = SAMPLE_PRODUCTS.find((p) => p.id === 'prod-tao-xanh')!
    const buoi = SAMPLE_PRODUCTS.find((p) => p.id === 'prod-buoi-da-xanh')!

    onSetCartItems([
      { product: taoXanh, quantity: 1 }, // 100.000
      { product: buoi, quantity: 2 },    // 72.750 x 2 = 145.500 => Total: 245.500₫
    ])

    setFormData({
      customer_name: 'Nguyễn Văn An',
      phone: '0908123456',
      email: 'an.nguyen@gmail.com',
      shipping_address: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
      payment_method: 'COD',
    })

    setClientIp('113.161.45.12')
    setIpCountry('VN')
    setDeviceFingerprint(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    )
    setCartDurationSeconds(52)
    setIsCartOpen(true)
  }

  const applyPreset2Fraud = () => {
    // ⚠️ Kịch bản 2: Nghi vấn Gian lận:
    // Tự động điền "Tran Hack", SĐT "0988888888", Địa chỉ "Bãi đất trống KCN Sóng Thần", Email "temp_hacker99@10minutemail.com",
    // mua 40 chùm Nho Mẫu Đơn trị giá 57.000.000đ, IP bất thường từ Nước ngoài, thiết bị Headless Browser
    const nho = SAMPLE_PRODUCTS.find((p) => p.id === 'prod-nho-mau-don')!

    onSetCartItems([
      { product: nho, quantity: 40 }, // 1.425.000 x 40 = 57.000.000₫
    ])

    setFormData({
      customer_name: 'Tran Hack',
      phone: '0988888888',
      email: 'temp_hacker99@10minutemail.com',
      shipping_address: 'Bãi đất trống KCN Sóng Thần, Dĩ An, Bình Dương',
      payment_method: 'CREDIT_CARD',
    })

    setClientIp('185.220.101.5') // Tor Exit Node Netherlands
    setIpCountry('NL')
    setDeviceFingerprint(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/119.0.6045.105 Safari/537.36'
    )
    setCartDurationSeconds(4)
    setIsCartOpen(true)
  }

  const applyPreset3Botnet = () => {
    // 🚨 Kịch bản 3: Tấn công Spam / Botnet:
    // Tự động điền chuỗi ký tự ngẫu nhiên, số lượng đặt hàng 100 món, thời gian đặt hàng 0.5 giây
    const cherry = SAMPLE_PRODUCTS.find((p) => p.id === 'prod-cherry-nz')!
    const hanhNhan = SAMPLE_PRODUCTS.find((p) => p.id === 'prod-hanh-nhan-usa')!

    onSetCartItems([
      { product: cherry, quantity: 50 },
      { product: hanhNhan, quantity: 50 },
    ])

    setFormData({
      customer_name: 'x89!@_bot_payload_sqli_null',
      phone: '0000000000',
      email: 'botnet_attack_483@throwaway.cc',
      shipping_address: '0x992 Null /dev/null DROP TABLE orders;--',
      payment_method: 'CREDIT_CARD',
    })

    setClientIp('45.154.255.89') // Suspicious proxy
    setIpCountry('RU')
    setDeviceFingerprint(
      'python-requests/2.31.0 cURL/8.2.1-DEV AutomationScript'
    )
    setCartDurationSeconds(0.5)
    setIsCartOpen(true)
  }

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng!')
      return
    }

    if (!formData.customer_name || !formData.phone || !formData.shipping_address) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!')
      return
    }

    const payload: TransactionPayload = {
      customer_name: formData.customer_name,
      phone: formData.phone,
      email: formData.email,
      shipping_address: formData.shipping_address,
      total_amount: totalAmount,
      items_count: totalItemsCount,
      payment_method: formData.payment_method,
      client_ip: clientIp,
      ip_country: ipCountry,
      device_fingerprint: deviceFingerprint,
      cart_duration_seconds: cartDurationSeconds,
      timestamp: new Date().toISOString(),
    }

    onCheckoutSubmit(formData, payload)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#166534] via-[#15803d] to-[#14532d] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 size-60 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/40 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-200">
                <Leaf className="size-3.5 text-emerald-400" />
                <span>Nông sản Hữu cơ VietGAP & Nhập khẩu Cao cấp</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                HTP FOODY — Trái Cây Tươi Sạch <br />
                <span className="text-emerald-300">Vì Sức Khỏe Người Tiêu Dùng</span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl leading-relaxed">
                Hệ thống thương mại điện tử bảo mật ứng dụng <strong className="text-white">AI Gemini phát hiện gian lận</strong> và <strong className="text-white">mã hóa AES-256-GCM kèm Blind Index</strong> bảo vệ dữ liệu người tiêu dùng.
              </p>

              {/* Demo presets bar right in the hero banner for quick access */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-2 flex items-center gap-1.5">
                  <FlaskConical className="size-3.5 text-amber-300" />
                  Kịch bản thử nghiệm bảo vệ đồ án (Interactive Demo Presets):
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={applyPreset1Valid}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition active:scale-95"
                  >
                    <span>🧪 Kịch bản 1: Đơn Hợp lệ</span>
                  </button>

                  <button
                    onClick={applyPreset2Fraud}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 transition active:scale-95"
                  >
                    <span>⚠️ Kịch bản 2: Nghi vấn Gian lận</span>
                  </button>

                  <button
                    onClick={applyPreset3Botnet}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-400 transition active:scale-95"
                  >
                    <span>🚨 Kịch bản 3: Tấn công Spam Bot</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards on Banner Right */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-slate-900">
              <div className="rounded-2xl bg-white/95 backdrop-blur p-4 shadow-lg border border-emerald-100 flex flex-col justify-between">
                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                  🍎
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-500 font-semibold block">Tiêu chuẩn kiểm định</span>
                  <span className="text-base font-black text-emerald-900">100% VietGAP & USDA</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/95 backdrop-blur p-4 shadow-lg border border-emerald-100 flex flex-col justify-between">
                <div className="size-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl">
                  🛡️
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-500 font-semibold block">Bảo mật thông tin</span>
                  <span className="text-base font-black text-blue-900">AES-256-GCM + Blind Index</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/95 backdrop-blur p-4 shadow-lg border border-emerald-100 flex flex-col justify-between">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
                  ⚡
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-500 font-semibold block">Trí tuệ nhân tạo</span>
                  <span className="text-base font-black text-amber-900">Gemini Fraud Detector</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/95 backdrop-blur p-4 shadow-lg border border-emerald-100 flex flex-col justify-between">
                <div className="size-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xl">
                  📦
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-500 font-semibold block">Giao hàng hỏa tốc</span>
                  <span className="text-base font-black text-purple-900">2 Giờ Thùng Xốp Lạnh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Origin Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm trái cây tươi, xuất xứ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedOrigin('ALL')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedOrigin === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả (7 món đề cương)
            </button>
            <button
              onClick={() => setSelectedOrigin('VN')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedOrigin === 'VN'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🇻🇳 Nông sản Việt Nam
            </button>
            <button
              onClick={() => setSelectedOrigin('IMPORT')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                selectedOrigin === 'IMPORT'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              ✈️ Trái cây Nhập khẩu
            </button>
          </div>
        </div>

        {/* Product Grid (7 items strictly as per outline) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300 overflow-hidden"
            >
              {/* Product Image & Badges */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.badge && (
                    <span className="rounded-lg bg-emerald-700/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white shadow">
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 rounded-lg bg-white/90 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-amber-600 shadow flex items-center gap-1">
                  <Star className="size-3 fill-amber-500 text-amber-500" />
                  {product.rating}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col p-4 justify-between">
                <div>
                  <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                    <MapPin className="size-3 text-emerald-600" />
                    {product.origin}
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-emerald-800">
                        {product.price.toLocaleString('vi-VN')}₫
                      </span>
                      <span className="text-xs text-slate-400">/{product.unit}</span>
                    </div>
                    {product.originalPrice > product.price && (
                      <span className="text-[11px] text-slate-400 line-through">
                        {product.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onAddToCart(product, 1)
                      setIsCartOpen(true)
                    }}
                    className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-700 active:scale-95 transition"
                    title="Thêm vào giỏ hàng"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Cart Button on Bottom Right */}
      {totalItemsCount > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-white shadow-2xl hover:bg-emerald-800 active:scale-95 transition animate-bounce"
        >
          <ShoppingCart className="size-5" />
          <span className="font-bold text-xs">Giỏ Hàng ({totalItemsCount})</span>
          <span className="rounded-lg bg-emerald-900 px-2 py-0.5 text-xs font-mono font-bold">
            {totalAmount.toLocaleString('vi-VN')}₫
          </span>
        </button>
      )}

      {/* Cart & Checkout Modal / Slide Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col text-slate-800 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-emerald-800 text-white">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="size-5 text-emerald-300" />
                <h3 className="font-bold text-base">Giỏ Hàng & Thanh Toán HTP Foody</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-700 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Presets Toolbar in Drawer */}
            <div className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <FlaskConical className="size-3.5 text-amber-700" />
                  NẠP KỊCH BẢN THỬ NGHIỆM ĐỒ ÁN (DEMO PRESETS):
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={applyPreset1Valid}
                  className="rounded-lg bg-emerald-700 px-2 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-800 transition text-center"
                >
                  🧪 1. Hợp lệ
                </button>
                <button
                  type="button"
                  onClick={applyPreset2Fraud}
                  className="rounded-lg bg-amber-500 px-2 py-1.5 text-[10px] font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition text-center"
                >
                  ⚠️ 2. Nghi vấn
                </button>
                <button
                  type="button"
                  onClick={applyPreset3Botnet}
                  className="rounded-lg bg-rose-600 px-2 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-rose-500 transition text-center"
                >
                  🚨 3. Spam Bot
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 text-xs">
              {/* Item List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Sản phẩm trong giỏ ({totalItemsCount})
                  </h4>
                  {cart.length > 0 && (
                    <button
                      onClick={onClearCart}
                      className="text-slate-400 hover:text-rose-600 font-semibold text-[11px]"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center text-slate-400">
                    <p>Giỏ hàng chưa có sản phẩm nào.</p>
                    <p className="mt-1 text-[11px]">Bấm vào nút &quot;Kịch bản&quot; ở trên để nạp dữ liệu mẫu!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="size-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h5>
                          <span className="text-[11px] text-emerald-700 font-bold">
                            {item.product.price.toLocaleString('vi-VN')}₫
                          </span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="flex size-6 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="flex size-6 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100"
                          >
                            <Plus className="size-3" />
                          </button>
                          <button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="ml-1 text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-3.5 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Thông tin giao hàng & người nhận
                </h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ và tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 0908123456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email nhận hóa đơn
                    </label>
                    <input
                      type="email"
                      placeholder="VD: an.nguyen@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Địa chỉ nhận hàng chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="VD: 475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Phương thức thanh toán
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'COD' })}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border text-center transition ${
                        formData.payment_method === 'COD'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="size-4" />
                      <span className="text-[10px]">Tiền mặt COD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'QR_TRANSFER' })}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border text-center transition ${
                        formData.payment_method === 'QR_TRANSFER'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="size-4" />
                      <span className="text-[10px]">QR Napas247</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'CREDIT_CARD' })}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border text-center transition ${
                        formData.payment_method === 'CREDIT_CARD'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="size-4" />
                      <span className="text-[10px]">Thẻ Quốc tế</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Telemetry / Risk Payload Details */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Dữ liệu Telemetry kèm theo Payload (AI Inspector):</span>
                    <span className="text-emerald-700 font-mono">{clientIp} ({ipCountry})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    Dấu vân tay: {deviceFingerprint.slice(0, 48)}...
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Thời gian giỏ hàng: <strong className="text-slate-600">{cartDurationSeconds}s</strong>
                  </div>
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tổng tiền đơn hàng:</span>
                <span className="text-lg font-black text-emerald-800">
                  {totalAmount.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || cart.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 disabled:opacity-50 transition active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="size-4 animate-spin text-emerald-300" />
                    <span>Gemini AI Đang Phân Tích Rủi Ro...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>Xác Nhận Thanh Toán & Đặt Hàng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
