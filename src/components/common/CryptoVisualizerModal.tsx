'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Key,
  Lock,
  Database,
  Hash,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  CheckCircle,
} from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'

export function CryptoVisualizerModal() {
  const {
    isCryptoVisualizerOpen,
    setIsCryptoVisualizerOpen,
    selectedOrderForCrypto,
    setViewMode,
  } = useSecurityOrder()

  const [currentStep, setCurrentStep] = useState(1)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (!isCryptoVisualizerOpen || !selectedOrderForCrypto) return null

  const order = selectedOrderForCrypto
  const plainName = order.decryptedPII?.customerName || 'Nguyễn Văn An'
  const plainPhone = order.decryptedPII?.phoneNumber || '0908123456'
  const plainAddr = order.decryptedPII?.deliveryAddress || '475A Điện Biên Phủ, Phường 25, Bình Thạnh'
  const plainCard = order.decryptedPII?.cardNumber || '9704229988776655'

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const steps = [
    {
      id: 1,
      title: '1. Bản Rõ PII (Plaintext Customer Data)',
      subtitle: 'Dữ liệu cá nhân nhạy cảm do khách hàng nhập',
      icon: Eye,
      description:
        'Thông tin cá nhân (Personally Identifiable Information - PII) trước khi mã hóa. Theo quy định An toàn thông tin và Nghị định 13/2023/NĐ-CP, việc lưu trữ trực tiếp dữ liệu này xuống CSDL tiềm ẩn rủi ro rò rỉ nếu server bị SQL Injection hoặc dump database.',
      content: (
        <div className="space-y-2 text-xs">
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Họ và tên khách hàng:</span>
            <p className="mt-1 font-mono font-bold text-white text-sm">{plainName}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Số điện thoại liên lạc:</span>
            <p className="mt-1 font-mono font-bold text-emerald-400 text-sm">{plainPhone}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Địa chỉ giao hàng:</span>
            <p className="mt-1 font-mono text-slate-200">{plainAddr}</p>
          </div>
          {plainCard && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <span className="text-slate-400">Số thẻ thanh toán:</span>
              <p className="mt-1 font-mono text-amber-300">{plainCard}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Dẫn Xuất Khóa PBKDF2 (Key Derivation)',
      subtitle: 'Tạo khóa đối xứng từ Master Secret & Salt',
      icon: Key,
      description:
        'Thuật toán PBKDF2-HMAC-SHA256 thực thi 100.000 vòng lặp (Iterations) kết hợp Salt ngẫu nhiên để sinh ra Khóa đối xứng AES 256-bit trong Web Crypto API Subtle. Khóa này chỉ tồn tại trong bộ nhớ RAM tạm thời và không bao giờ lưu lộ thiên.',
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Master Secret Passphrase:</span>
            <p className="mt-1 font-mono text-blue-300 truncate">
              MARKETPLACE_SHOPEE_LAZADA_MASTER_KEY_2026
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <span className="text-slate-400">Thuật toán băm:</span>
              <p className="mt-1 font-mono font-bold text-white">PBKDF2-HMAC-SHA256</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <span className="text-slate-400">Số vòng lặp:</span>
              <p className="mt-1 font-mono font-bold text-emerald-400">100.000 Rounds</p>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3">
            <span className="text-blue-300 font-semibold">Khóa dẫn xuất CryptoKey (AES-256):</span>
            <p className="mt-1 font-mono text-[11px] text-slate-300 break-all">
              [CryptoKey: type=&quot;secret&quot;, extractable=false, algorithm=AES-GCM, length=256]
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Mã Hóa AES-256-GCM & GMAC Tag',
      subtitle: 'Authenticated Encryption với IV 96-bit & Tag 128-bit',
      icon: Lock,
      description:
        'Chuẩn mã hóa Galois/Counter Mode (AES-256-GCM) được tài chính quốc tế tin dùng. Mỗi trường PII được gán một Vector khởi tạo (IV) ngẫu nhiên và một Thẻ xác thực GMAC. Bất kỳ sự thay đổi dù chỉ 1 bit trong CSDL đều làm hỏng GMAC Tag và bị từ chối giải mã.',
      content: (
        <div className="space-y-2 text-xs">
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <div className="flex justify-between items-center text-slate-400">
              <span>Tên mã hóa (enc_name):</span>
              <button
                onClick={() => handleCopy(order.encryptedPII.customerName.ciphertextHex, 'enc_name')}
                className="hover:text-white"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="mt-1 font-mono text-purple-300 text-[11px] break-all">
              Cipher: {order.encryptedPII.customerName.ciphertextHex}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              IV: {order.encryptedPII.customerName.ivHex} | Tag: {order.encryptedPII.customerName.authTagHex}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <div className="flex justify-between items-center text-slate-400">
              <span>SĐT mã hóa (enc_phone):</span>
              <button
                onClick={() => handleCopy(order.encryptedPII.phoneNumber.ciphertextHex, 'enc_phone')}
                className="hover:text-white"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="mt-1 font-mono text-purple-300 text-[11px] break-all">
              Cipher: {order.encryptedPII.phoneNumber.ciphertextHex}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              IV: {order.encryptedPII.phoneNumber.ivHex} | Tag: {order.encryptedPII.phoneNumber.authTagHex}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <div className="flex justify-between items-center text-slate-400">
              <span>Địa chỉ mã hóa (enc_addr):</span>
              <button
                onClick={() => handleCopy(order.encryptedPII.deliveryAddress.ciphertextHex, 'enc_addr')}
                className="hover:text-white"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="mt-1 font-mono text-purple-300 text-[11px] break-all">
              Cipher: {order.encryptedPII.deliveryAddress.ciphertextHex}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              IV: {order.encryptedPII.deliveryAddress.ivHex} | Tag: {order.encryptedPII.deliveryAddress.authTagHex}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. Băm Blind Index & Checksum Niêm Phong',
      subtitle: 'Tra cứu O(1) không cần giải mã & Bảo toàn dữ liệu',
      icon: Hash,
      description:
        'Vì ciphertext ngẫu nhiên mỗi lần mã hóa (do IV ngẫu nhiên), hệ thống tạo Blind Index bằng HMAC-SHA256 trên số điện thoại để tra cứu O(1) trực tiếp trên DB. Đồng thời băm SHA-256 toàn bộ đơn hàng làm mã niêm phong (Checksum).',
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-emerald-300">
                Blind Index (HMAC-SHA256):
              </span>
              <span className="text-[10px] text-emerald-400">Dùng tìm kiếm theo SĐT</span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-white break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
              {order.phoneBlindIndex}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-cyan-300">
                Record Checksum (SHA-256 Seal):
              </span>
              <span className="text-[10px] text-cyan-400">Mã niêm phong bản ghi</span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-white break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
              {order.recordChecksum}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. Lưu CSDL An Toàn (Zero-Knowledge Storage)',
      subtitle: 'Bảo vệ PII tuyệt đối trước nguy cơ lộ lọt dữ liệu',
      icon: Database,
      description:
        'Bản ghi hoàn chỉnh được lưu xuống CSDL sàn TMĐT. Kẻ tấn công cho dù dump toàn bộ bảng database cũng chỉ thấy các chuỗi hex vô nghĩa, hoàn toàn không thể đọc trộm hay sửa đổi dữ liệu đơn hàng!',
      content: (
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-[11px] space-y-1 text-slate-300">
          <div className="text-emerald-400 font-bold mb-2">// Dữ liệu đã lưu an toàn trong CSDL:</div>
          <div>&quot;order_code&quot;: <span className="text-amber-300">&quot;{order.orderCode}&quot;</span>,</div>
          <div>&quot;enc_name&quot;: <span className="text-purple-300">&quot;{order.encryptedPII.customerName.ciphertextHex.slice(0, 16)}...&quot;</span>,</div>
          <div>&quot;enc_phone&quot;: <span className="text-purple-300">&quot;{order.encryptedPII.phoneNumber.ciphertextHex.slice(0, 16)}...&quot;</span>,</div>
          <div>&quot;phone_blind_index&quot;: <span className="text-emerald-300">&quot;{order.phoneBlindIndex.slice(0, 20)}...&quot;</span>,</div>
          <div>&quot;record_checksum&quot;: <span className="text-cyan-300">&quot;{order.recordChecksum.slice(0, 20)}...&quot;</span>,</div>
          <div>&quot;final_amount&quot;: <span className="text-amber-300">{order.finalTotalAmount}</span>,</div>
          <div>&quot;fulfillment_status&quot;: <span className="text-emerald-400">&quot;{order.fulfillmentStatus}&quot;</span></div>
        </div>
      ),
    },
  ]

  const activeStepData = steps[currentStep - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Quy Trình Mật Mã Phong Bì (Envelope Crypto)</h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diễn họa luồng biến đổi dữ liệu trước khi ghi CSDL (Đơn: {order.orderCode})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCryptoVisualizerOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 5-step pipeline bar */}
        <div className="my-4 grid grid-cols-5 gap-1.5">
          {steps.map((st) => {
            const Icon = st.icon
            const isDone = currentStep > st.id
            const isActive = currentStep === st.id
            return (
              <button
                key={st.id}
                onClick={() => setCurrentStep(st.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl p-2 text-center transition border ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm'
                    : isDone
                    ? 'border-slate-700 bg-slate-800 text-slate-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-400'
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-xl ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : isDone
                      ? 'bg-slate-700 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="size-3.5" />
                </div>
                <span className="text-[10px] font-bold line-clamp-1">Bước {st.id}</span>
              </button>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {activeStepData.id}
              </span>
              <h4 className="text-sm font-bold text-white">{activeStepData.title}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeStepData.description}
            </p>
          </div>

          <div>{activeStepData.content}</div>

          {copiedKey && (
            <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle className="size-3.5" />
              Đã sao chép {copiedKey} vào Clipboard!
            </div>
          )}
        </div>

        {/* Modal Controls */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Quay lại
            </button>
            <button
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              disabled={currentStep === 5}
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              Tiếp theo
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsCryptoVisualizerOpen(false)
                setViewMode('ADMIN')
              }}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <Database className="size-3.5" />
              Xem Trong CSDL Admin
            </button>
            <button
              onClick={() => setIsCryptoVisualizerOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
            >
              Hoàn Tất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
