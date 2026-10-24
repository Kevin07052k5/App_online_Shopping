/**
 * Format currency to Vietnamese Dong (VNĐ)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Truncate long hex string for display with ellipsis
 */
export function truncateHex(hex: string, startChars: number = 8, endChars: number = 8): string {
  if (!hex) return ''
  if (hex.length <= startChars + endChars) return hex
  return `${hex.slice(0, startChars)}...${hex.slice(-endChars)}`
}

/**
 * Generate a random order ID (e.g., ORD-2026-X89)
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const randomNum = Math.floor(100 + Math.random() * 900)
  return `ORD-2026-${code}${randomNum}`
}

/**
 * Convert bytes to hex string
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  if (!hex || typeof hex !== 'string') return new Uint8Array(0)
  let cleanHex = hex.trim().replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '')
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex
  }
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    const val = parseInt(cleanHex.substring(i, i + 2), 16)
    bytes[i / 2] = isNaN(val) ? 0 : val
  }
  return bytes
}

// Compatibility aliases
export const hexToBytes = hexToBuffer
export const bytesToHex = bufferToHex

/**
 * Format timestamp to readable Vietnamese date string
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
