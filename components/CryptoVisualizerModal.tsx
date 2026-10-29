'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  Key,
  Lock,
  Database,
  ArrowRight,
  Hash,
  CheckCircle,
  Copy,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  FileCode,
} from 'lucide-react'
import { EncryptedOrderRecord } from '@/lib/types'

interface CryptoVisualizerModalProps {
  isOpen: boolean
  onClose: () => void
  record: EncryptedOrderRecord | null
  onGoToAdmin?: () => void
}

export function CryptoVisualizerModal({
  isOpen,
  onClose,
  record,
  onGoToAdmin,
}: CryptoVisualizerModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (!isOpen || !record) return null

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const plainName = record.decryptedData?.customer_name || 'Nguyễn Văn An'
  const plainPhone = record.decryptedData?.phone || '0908123456'
  const plainAddr =
    record.decryptedData?.shipping_address ||
    '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM'

  const steps = [
    {
      id: 1,
      title: '1. Bản rõ (Plaintext PII)',
      subtitle: 'Dữ liệu cá nhân chưa mã hóa',
      icon: Eye,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      description:
        'Thông tin cá nhân (PII - Personally Identifiable Information) do khách hàng nhập vào đơn hàng. Theo Nghị định 13/2023/NĐ-CP, việc lưu trữ trực tiếp bản rõ này vào CSDL sẽ tiềm ẩn nguy cơ rò rỉ nghiêm trọng nếu máy chủ bị xâm nhập.',
      content: (
        <div className="space-y-2 text-xs">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Họ và tên:</span>
            <p className="mt-1 font-mono font-bold text-white text-sm">{plainName}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Số điện thoại:</span>
            <p className="mt-1 font-mono font-bold text-emerald-400 text-sm">{plainPhone}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Địa chỉ giao hàng:</span>
            <p className="mt-1 font-mono text-slate-200">{plainAddr}</p>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Dẫn xuất Khóa PBKDF2',
      subtitle: 'Password-Based Key Derivation Function 2',
      icon: Key,
      color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      description:
        'Sử dụng thuật toán chuẩn PBKDF2 với hàm băm SHA-256 qua 100.000 vòng lặp (Iterations) kết hợp Salt ngẫu nhiên để biến đổi Master Passphrase thành Khóa đối xứng AES 256-bit an toàn trước các cuộc tấn công Rainbow Table & Brute-Force.',
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            <span className="text-slate-400">Master Secret Passphrase:</span>
            <p className="mt-1 font-mono text-blue-300 truncate">HTP_FOODY_MASTER_VAULT_KEY_VN_2026</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
              <span className="text-slate-400">Thuật toán băm:</span>
              <p className="mt-1 font-mono font-bold text-white">PBKDF2-HMAC-SHA256</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
              <span className="text-slate-400">Vòng lặp:</span>
              <p className="mt-1 font-mono font-bold text-emerald-400">100.000 Rounds</p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
            <span className="text-blue-300 font-semibold">Khóa dẫn xuất (AES-256 CryptoKey):</span>
            <p className="mt-1 font-mono text-[11px] text-slate-300 break-all">
              [CryptoKey: type=&quot;secret&quot;, extractable=false, algorithm=AES-GCM, length=256]
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Mã hóa AES-256-GCM & GMAC',
      subtitle: 'Galois/Counter Mode có Thẻ Xác thực',
      icon: Lock,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      description:
        'AES-256-GCM là chuẩn mã hóa đối xứng hàng đầu trong ngành tài chính và quân sự. Mỗi trường dữ liệu được sinh một Vector khởi tạo (IV) 96-bit ngẫu nhiên và một Thẻ xác thực (Auth Tag / GMAC) 128-bit nhằm phát hiện mọi hành vi can thiệp hay sửa đổi trái phép.',
      content: (
        <div className="space-y-2 text-xs">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-2.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Mã hóa Tên (enc_name):</span>
              <button
                onClick={() => handleCopy(record.enc_name.ciphertextHex, 'enc_name')}
                className="hover:text-white"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="mt-1 font-mono text-purple-300 text-[11px] break-all">
              Cipher: {record.enc_name.ciphertextHex}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              IV: {record.enc_name.ivHex} | Tag: {record.enc_name.tagHex}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-2.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Mã hóa SĐT (enc_phone):</span>
              <button
                onClick={() => handleCopy(record.enc_phone.ciphertextHex, 'enc_phone')}
                className="hover:text-white"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="mt-1 font-mono text-purple-300 text-[11px] break-all">
              Cipher: {record.enc_phone.ciphertextHex}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              IV: {record.enc_phone.ivHex} | Tag: {record.enc_phone.tagHex}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-2.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Mã hóa Địa chỉ (enc_addr):</span>
              <button
                onClick={() => handleCopy(record.enc_addr.ciphertextHex, 'enc_addr')}
                className="hover:text-white"
              >
                <Copy className="size-3" />
              </button>
            </div>
            <p className="mt-1 font-mono text-purple-300 text-[11px] break-all">
              Cipher: {record.enc_addr.ciphertextHex}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              IV: {record.enc_addr.ivHex} | Tag: {record.enc_addr.tagHex}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. Blind Index & Checksum',
      subtitle: 'Tìm kiếm không cần giải mã & Toàn vẹn dữ liệu',
      icon: Hash,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      description:
        'Vì ciphertext ngẫu nhiên mỗi lần mã hóa (do IV khác nhau), ta áp dụng kỹ thuật Blind Index bằng HMAC-SHA256 trên SĐT để tìm kiếm O(1). Đồng thời tính SHA-256 Checksum trên toàn bộ bản ghi để đảm bảo tính toàn vẹn tuyệt đối.',
      content: (
        <div className="space-y-2 text-xs">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-emerald-300">
                Blind Index (HMAC-SHA256):
              </span>
              <span className="text-[10px] text-emerald-400">Dùng để tra cứu SĐT</span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-white break-all bg-slate-950 p-2 rounded-lg border border-slate-800">
              {record.phone_blind_index}
            </p>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-cyan-300">
                Record Checksum (SHA-256):
              </span>
              <span className="text-[10px] text-cyan-400">Khóa toàn vẹn bản ghi</span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-white break-all bg-slate-950 p-2 rounded-lg border border-slate-800">
              {record.record_checksum}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. Lưu CSDL An Toàn (Secure DB)',
      subtitle: 'Zero-Knowledge đối với tầng Database',
      icon: Database,
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
      description:
        'Bản ghi hoàn chỉnh được lưu xuống CSDL. Hacker dù dump được toàn bộ Database cũng chỉ thấy các chuỗi hex ngẫu nhiên vô nghĩa, không thể khai thác thông tin khách hàng mà không có Master Key!',
      content: (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-[11px] space-y-1.5 text-slate-300">
          <div className="text-emerald-400 font-bold mb-2">// Dữ liệu đã cam kết vào Database:</div>
          <div><span className="text-indigo-300">&quot;order_code&quot;</span>: <span className="text-amber-300">&quot;{record.orderCode}&quot;</span>,</div>
          <div><span className="text-indigo-300">&quot;enc_name&quot;</span>: <span className="text-purple-300">&quot;{record.enc_name.ciphertextHex.substring(0, 16)}...&quot;</span>,</div>
          <div><span className="text-indigo-300">&quot;enc_phone&quot;</span>: <span className="text-purple-300">&quot;{record.enc_phone.ciphertextHex.substring(0, 16)}...&quot;</span>,</div>
          <div><span className="text-indigo-300">&quot;phone_blind_index&quot;</span>: <span className="text-emerald-300">&quot;{record.phone_blind_index.substring(0, 20)}...&quot;</span>,</div>
          <div><span className="text-indigo-300">&quot;record_checksum&quot;</span>: <span className="text-cyan-300">&quot;{record.record_checksum.substring(0, 20)}...&quot;</span>,</div>
          <div><span className="text-indigo-300">&quot;total_amount&quot;</span>: <span className="text-amber-300">{record.total_amount}</span>,</div>
          <div><span className="text-indigo-300">&quot;fulfillment_status&quot;</span>: <span className="text-emerald-400">&quot;{record.status}&quot;</span></div>
        </div>
      ),
    },
  ]

  const activeStepData = steps[currentStep - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Quy Trình Mật Mã Tầng Ứng Dụng</h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                  AES-256-GCM + Blind Index
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mô phỏng trực quan luồng biến đổi dữ liệu trước khi ghi xuống CSDL (Mã đơn: {record.orderCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Pipeline Bar (5 stages) */}
        <div className="my-4 grid grid-cols-5 gap-1.5">
          {steps.map((st) => {
            const Icon = st.icon
            const isDone = currentStep > st.id
            const isActive = currentStep === st.id
            return (
              <button
                key={st.id}
                onClick={() => setCurrentStep(st.id)}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center transition border ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm'
                    : isDone
                    ? 'border-slate-700 bg-slate-800 text-slate-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-400'
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : isDone
                      ? 'bg-slate-700 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="size-3.5" />
                </div>
                <span className="text-[10px] font-semibold leading-tight line-clamp-1">
                  Bước {st.id}
                </span>
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
              <span className="text-xs text-slate-400">— {activeStepData.subtitle}</span>
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

        {/* Footer controls */}
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
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Hoàn Tất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
