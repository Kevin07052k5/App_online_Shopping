'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  Search,
  Eye,
  EyeOff,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Key,
  RotateCcw,
  CheckCircle,
  Copy,
  AlertTriangle,
} from 'lucide-react'
import { useSecurityOrder } from '@/src/context/SecurityOrderContext'
import { computeBlindIndex, decryptOrderPIIField } from '@/src/services/webCryptoService'
import { CiphertextPackage } from '@/src/types/crypto'
import { truncateHex, formatVND } from '@/src/utils/helpers'

// Component giải mã trực tiếp thời gian thực bằng Web Crypto API (AES-256-GCM)
function DecryptedField({
  pkg,
  fallback,
  className,
}: {
  pkg?: CiphertextPackage
  fallback?: string
  className?: string
}) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    if (!pkg || !pkg.ciphertextHex) {
      setText(fallback || '')
      setError(false)
      return
    }

    decryptOrderPIIField(pkg.ciphertextHex, pkg.ivHex, pkg.authTagHex)
      .then((decrypted) => {
        if (isMounted) {
          setText(decrypted)
          setError(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setText(null)
          setError(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [pkg?.ciphertextHex, pkg?.ivHex, pkg?.authTagHex, fallback])

  if (error) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-500/70 animate-pulse font-sans">
        <AlertTriangle className="size-3 text-rose-400" />
        Lỗi GMAC (Bị can thiệp!)
      </span>
    )
  }

  if (text === null) {
    return <span className="text-slate-500 text-xs italic font-sans">Đang giải mã AES-256...</span>
  }

  return <span className={className}>{text}</span>
}

export function EncryptedDbExplorer() {
  const {
    orders,
    isAuthorizedDecrypted,
    toggleAuthorizedDecrypt,
    simulateTamper,
    restoreTampered,
    verifyIntegrity,
    showToast,
  } = useSecurityOrder()

  const [searchPhone, setSearchPhone] = useState('')
  const [computedBlindIndex, setComputedBlindIndex] = useState('')
  const [matchedOrderId, setMatchedOrderId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleSearchBlindIndex = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchPhone.trim()) {
      setComputedBlindIndex('')
      setMatchedOrderId(null)
      showToast('WARNING', 'Ô tìm kiếm trống', 'Vui lòng nhập số điện thoại cần tra cứu.')
      return
    }

    // Kiểm tra định dạng số điện thoại
    const cleanDigits = searchPhone.replace(/\D/g, '')
    if (cleanDigits.length < 9 || cleanDigits.length > 12) {
      showToast('WARNING', 'Định dạng SĐT không hợp lệ', 'Vui lòng nhập số điện thoại gồm 9 - 11 chữ số để tạo mã Blind Index.')
      return
    }

    setIsSearching(true)
    try {
      // Compute HMAC-SHA256 Blind Index locally
      const bIndex = await computeBlindIndex(searchPhone.trim())
      setComputedBlindIndex(bIndex)

      // Query database: WHERE phone_blind_index == computed HMAC
      const found = orders.find((o) => o.phoneBlindIndex.toLowerCase() === bIndex.toLowerCase())
      setMatchedOrderId(found ? found.id : 'NOT_FOUND')
    } catch (err) {
      console.error('Blind Index search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Toggle Decrypt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="size-5 text-purple-400" />
            <span>CSDL Mã Hóa &amp; Phòng Thí Nghiệm Tấn Công (Encrypted DB Explorer)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Dữ liệu PII được mã hóa AES-256-GCM, tra cứu O(1) qua Blind Index HMAC-SHA256 và niêm phong bằng Checksum
          </p>
        </div>

        {/* Authorized Decrypt Toggle */}
        <button
          onClick={toggleAuthorizedDecrypt}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-lg ${
            isAuthorizedDecrypted
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {isAuthorizedDecrypted ? (
            <>
              <EyeOff className="size-4" />
              <span>Ẩn Bản Rõ (Khóa Lại)</span>
            </>
          ) : (
            <>
              <Eye className="size-4" />
              <span>👁️ Giải Mã Hợp Lệ (Authorized Decrypt)</span>
            </>
          )}
        </button>
      </div>

      {/* Blind Index Search Box */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Fingerprint className="size-4" />
            Tra Cứu Khách Hàng Bằng Blind Index (HMAC-SHA256):
          </span>
          <span className="text-[11px] text-slate-400">
            Tìm kiếm chính xác mà KHÔNG CẦN giải mã cơ sở dữ liệu!
          </span>
        </div>

        <form onSubmit={handleSearchBlindIndex} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập SĐT để test Blind Index (VD: 0908123456, 0912345678, 0977665544, 0988888888)..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
          >
            {isSearching ? 'Đang băm HMAC...' : 'Băm & Tra Cứu Blind Index'}
          </button>
        </form>

        {computedBlindIndex && (
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Chuỗi HMAC-SHA256 Blind Index sinh ra tại Client:</span>
              {matchedOrderId === 'NOT_FOUND' ? (
                <span className="text-rose-400 font-bold">Không tìm thấy bản ghi nào khớp trong CSDL!</span>
              ) : (
                <span className="text-emerald-400 font-bold">Tìm thấy 1 bản ghi khớp hoàn toàn trong CSDL!</span>
              )}
            </div>
            <p className="font-mono text-[11px] text-emerald-300 break-all bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              {computedBlindIndex}
            </p>
          </div>
        )}
      </div>

      {/* Database Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn / Thời Gian</th>
                <th className="py-3.5 px-4">Tên (enc_name)</th>
                <th className="py-3.5 px-4">SĐT (enc_phone) &amp; Blind Index</th>
                <th className="py-3.5 px-4">Địa Chỉ (enc_addr)</th>
                <th className="py-3.5 px-4">Mã Checksum (SHA-256)</th>
                <th className="py-3.5 px-4">Trạng Thái Toàn Vẹn</th>
                <th className="py-3.5 px-4 text-right">Phòng Thí Nghiệm Tấn Công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {orders.map((ord) => {
                const isMatched = matchedOrderId === ord.id
                const isTampered = ord.isTampered

                return (
                  <tr
                    key={ord.id}
                    className={`transition ${
                      isTampered
                        ? 'bg-rose-950/40 text-rose-200'
                        : isMatched
                        ? 'bg-emerald-950/40 text-emerald-200'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Mã đơn */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{ord.orderCode}</span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        {ord.createdAt.slice(11, 19)}
                      </span>
                    </td>

                    {/* Tên */}
                    <td className="py-3.5 px-4">
                      {isAuthorizedDecrypted ? (
                        <DecryptedField
                          pkg={ord.encryptedPII.customerName}
                          fallback={ord.decryptedPII?.customerName}
                          className="text-emerald-400 font-sans font-bold"
                        />
                      ) : (
                        <div title={ord.encryptedPII.customerName.ciphertextHex}>
                          <span className="text-purple-300 block truncate max-w-[130px]">
                            {ord.encryptedPII.customerName.ciphertextHex}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                            Tag: {ord.encryptedPII.customerName.authTagHex.slice(0, 12)}...
                          </span>
                        </div>
                      )}
                    </td>

                    {/* SĐT & Blind Index */}
                    <td className="py-3.5 px-4">
                      {isAuthorizedDecrypted ? (
                        <DecryptedField
                          pkg={ord.encryptedPII.phoneNumber}
                          fallback={ord.decryptedPII?.phoneNumber}
                          className="text-emerald-400 font-bold block"
                        />
                      ) : (
                        <div>
                          <span className="text-purple-300 block truncate max-w-[130px]">
                            {ord.encryptedPII.phoneNumber.ciphertextHex}
                          </span>
                          <span
                            className="text-[10px] text-emerald-400/90 block truncate max-w-[130px]"
                            title={ord.phoneBlindIndex}
                          >
                            BIndex: {ord.phoneBlindIndex.slice(0, 14)}...
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Địa chỉ */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      {isAuthorizedDecrypted ? (
                        <div className="max-w-[200px] truncate" title={ord.decryptedPII?.deliveryAddress}>
                          <DecryptedField
                            pkg={ord.encryptedPII.deliveryAddress}
                            fallback={ord.decryptedPII?.deliveryAddress}
                            className="text-slate-200 font-sans block truncate"
                          />
                        </div>
                      ) : (
                        <div>
                          <span
                            className={`block truncate ${
                              isTampered ? 'text-rose-400 font-bold underline' : 'text-purple-300'
                            }`}
                            title={ord.encryptedPII.deliveryAddress.ciphertextHex}
                          >
                            {ord.encryptedPII.deliveryAddress.ciphertextHex}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            IV: {ord.encryptedPII.deliveryAddress.ivHex.slice(0, 10)}...
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Checksum */}
                    <td className="py-3.5 px-4">
                      <span
                        className="text-cyan-300 block truncate max-w-[130px]"
                        title={ord.recordChecksum}
                      >
                        {ord.recordChecksum.slice(0, 18)}...
                      </span>
                    </td>

                    {/* Trạng thái toàn vẹn */}
                    <td className="py-3.5 px-4 font-sans">
                      {isTampered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/50 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                          <ShieldX className="size-3" />
                          BỊ CAN THIỆP!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <ShieldCheck className="size-3" />
                          Toàn Vẹn
                        </span>
                      )}
                    </td>

                    {/* Thao tác mô phỏng tấn công & kiểm tra */}
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {isTampered ? (
                          <button
                            onClick={() => restoreTampered(ord.id)}
                            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                          >
                            Khôi phục
                          </button>
                        ) : (
                          <button
                            onClick={() => simulateTamper(ord.id)}
                            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/20 transition"
                            title="Mô phỏng hacker sửa đổi 1 byte trong CSDL"
                          >
                            ⚠️ Sửa 1 Byte
                          </button>
                        )}

                        <button
                          onClick={() => verifyIntegrity(ord.id)}
                          className="rounded-xl bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-slate-700 transition"
                          title="Đối soát chữ ký Checksum SHA-256 và thẻ GMAC"
                        >
                          🛡️ Kiểm Tra
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
