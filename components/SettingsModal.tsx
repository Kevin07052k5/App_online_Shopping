'use client'

import { useState } from 'react'
import {
  KeyRound,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Cpu,
  Lock,
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  onSaveApiKey: (key: string) => void
  modelName: string
  onSaveModelName: (model: string) => void
  onResetData: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  modelName,
  onSaveModelName,
  onResetData,
}: SettingsModalProps) {
  const [tempKey, setTempKey] = useState(apiKey)
  const [tempModel, setTempModel] = useState(modelName)
  const [testingStatus, setTestingStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle')
  const [testMessage, setTestMessage] = useState('')

  if (!isOpen) return null

  const handleSave = () => {
    onSaveApiKey(tempKey.trim())
    onSaveModelName(tempModel)
    onClose()
  }

  const handleTestKey = async () => {
    if (!tempKey.trim()) {
      setTestingStatus('error')
      setTestMessage('Vui lòng nhập API Key để kiểm tra!')
      return
    }

    setTestingStatus('testing')
    setTestMessage('Đang kết nối đến máy chủ Google Gemini...')

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${tempModel}:generateContent?key=${tempKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Trả về đúng chữ: PONG' }] }],
          }),
        }
      )

      if (res.ok) {
        setTestingStatus('success')
        setTestMessage('Kết nối Gemini API thành công! Mô hình hoạt động bình thường.')
      } else {
        const errorData = await res.json().catch(() => ({}))
        setTestingStatus('error')
        setTestMessage(
          `Lỗi (${res.status}): ${errorData.error?.message || 'API Key không hợp lệ hoặc bị hạn chế.'}`
        )
      }
    } catch (err: any) {
      setTestingStatus('error')
      setTestMessage(`Lỗi mạng: ${err.message || 'Không thể gửi yêu cầu.'}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Cài đặt Hệ thống & AI Key</h3>
            <p className="text-xs text-slate-400">
              Quản lý Gemini API Key và cơ chế bảo mật CSDL
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <span className="text-[11px] font-normal text-emerald-400">
                {tempKey ? 'Đã cấu hình' : 'Dùng Mock Engine (Fallback)'}
              </span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="password"
                placeholder="Dán AIzaSy... vào đây"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              * Lưu trữ an toàn trong <code className="text-emerald-400">localStorage</code> trình duyệt. Nếu bỏ trống, hệ thống tự động kích hoạt bộ suy luận quy luật chuẩn bị sẵn cho buổi bảo vệ đồ án.
            </p>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mô hình AI Fraud Detector
            </label>
            <select
              value={tempModel}
              onChange={(e) => setTempModel(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash (Khuyên dùng - Phản hồi siêu tốc)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash (Mô hình thế hệ mới)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Phân tích chuyên sâu)</option>
            </select>
          </div>

          {/* Testing Status Feedback */}
          {testingStatus !== 'idle' && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                testingStatus === 'testing'
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : testingStatus === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {testingStatus === 'testing' && (
                  <Sparkles className="size-4 animate-spin" />
                )}
                {testingStatus === 'success' && (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                )}
                {testingStatus === 'error' && (
                  <AlertTriangle className="size-4 text-rose-400" />
                )}
                <span className="font-semibold">{testMessage}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTestKey}
              disabled={testingStatus === 'testing'}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              {testingStatus === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối API'}
            </button>
          </div>

          {/* Security Features Status */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
              <Lock className="size-3.5 text-emerald-400" />
              <span>Trạng thái Mật mã học (Web Crypto Subtle):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>PBKDF2 Derivation: 100.000 rounds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>AES-256-GCM: 96-bit IV, 128-bit Tag</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Blind Index: HMAC-SHA256</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Integrity: SHA-256 Checksum</span>
              </div>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300">Khôi phục Dữ liệu Mẫu</p>
              <p className="text-[11px] text-slate-500">Xóa đơn hàng mới và nạp lại 5 đơn mẫu ban đầu</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Bạn có chắc muốn đặt lại dữ liệu cơ sở dữ liệu mẫu ban đầu?')) {
                  onResetData()
                  onClose()
                }
              }}
              className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
            >
              <RotateCcw className="size-3.5" />
              Đặt lại CSDL
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  )
}
