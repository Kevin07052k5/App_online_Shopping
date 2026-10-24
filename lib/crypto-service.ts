import { EncryptedField, EncryptedOrderRecord } from './types'

const MASTER_PASSPHRASE = 'HTP_FOODY_MASTER_VAULT_KEY_VN_2026'
const MASTER_SALT = 'HTP_ORGANIC_SALT_VAL_992'
const BLIND_INDEX_SECRET = 'BLIND_INDEX_HMAC_SECRET_FRUITS_2026'

// Convert Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Convert Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/, '')
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
  }
  return bytes
}

// Derive AES-GCM 256-bit Key from passphrase using PBKDF2
export async function getMasterCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(MASTER_PASSPHRASE),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(MASTER_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt plaintext string using AES-256-GCM
export async function encryptField(
  plaintext: string,
  key?: CryptoKey
): Promise<EncryptedField> {
  const cryptoKey = key || (await getMasterCryptoKey())
  const enc = new TextEncoder()
  const encodedPlaintext = enc.encode(plaintext)

  // Generate a cryptographically secure 12-byte (96-bit) IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  // In Web Crypto API AES-GCM, subtle.encrypt appends 16-byte Auth Tag to ciphertext
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 16 bytes auth tag
    },
    cryptoKey,
    encodedPlaintext
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)
  // Split ciphertext and 16-byte Auth Tag (last 16 bytes)
  const tagLengthBytes = 16
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - tagLengthBytes)
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - tagLengthBytes)

  return {
    ciphertextHex: bytesToHex(ciphertextBytes),
    ivHex: bytesToHex(iv),
    tagHex: bytesToHex(tagBytes),
  }
}

// Decrypt field using AES-256-GCM; returns string or throws if tampered
export async function decryptField(
  field: EncryptedField,
  key?: CryptoKey
): Promise<string> {
  const cryptoKey = key || (await getMasterCryptoKey())
  const ivBytes = hexToBytes(field.ivHex)
  const ciphertextBytes = hexToBytes(field.ciphertextHex)
  const tagBytes = hexToBytes(field.tagHex)

  // Combine ciphertext + tag for Web Crypto Subtle
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length)
  combined.set(ciphertextBytes, 0)
  combined.set(tagBytes, ciphertextBytes.length)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
      tagLength: 128,
    },
    cryptoKey,
    combined
  )

  const dec = new TextDecoder()
  return dec.decode(decryptedBuffer)
}

// Normalize and hash phone number using HMAC-SHA256 (Blind Index)
export async function computeBlindIndex(phone: string): Promise<string> {
  const cleanPhone = phone.replace(/[\s.-]/g, '').trim()
  const enc = new TextEncoder()

  const hmacKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(BLIND_INDEX_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    hmacKey,
    enc.encode(cleanPhone)
  )

  return bytesToHex(new Uint8Array(signature))
}

// Compute SHA-256 Checksum over critical record properties
export async function computeRecordChecksum(data: {
  orderCode: string
  enc_name: EncryptedField
  enc_phone: EncryptedField
  enc_addr: EncryptedField
  phone_blind_index: string
  total_amount: number
}): Promise<string> {
  const canonicalString = JSON.stringify({
    orderCode: data.orderCode,
    nameCipher: data.enc_name.ciphertextHex,
    nameTag: data.enc_name.tagHex,
    phoneCipher: data.enc_phone.ciphertextHex,
    phoneTag: data.enc_phone.tagHex,
    addrCipher: data.enc_addr.ciphertextHex,
    addrTag: data.enc_addr.tagHex,
    blindIndex: data.phone_blind_index,
    amount: data.total_amount,
  })

  const enc = new TextEncoder()
  const hashBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    enc.encode(canonicalString)
  )

  return bytesToHex(new Uint8Array(hashBuffer))
}

// Verify both SHA-256 Checksum and AES-GCM Auth Tag
export async function verifyRecordIntegrity(
  record: EncryptedOrderRecord
): Promise<{
  isValid: boolean
  checksumMatches: boolean
  gmacValid: boolean
  errorDetail?: string
}> {
  // 1. Recalculate SHA-256 Checksum
  const computedChecksum = await computeRecordChecksum({
    orderCode: record.orderCode,
    enc_name: record.enc_name,
    enc_phone: record.enc_phone,
    enc_addr: record.enc_addr,
    phone_blind_index: record.phone_blind_index,
    total_amount: record.total_amount,
  })

  const checksumMatches = computedChecksum === record.record_checksum

  // 2. Validate AES-GCM authentication tags by attempting decryption
  let gmacValid = true
  let errorDetail = ''

  try {
    const key = await getMasterCryptoKey()
    await decryptField(record.enc_name, key)
    await decryptField(record.enc_phone, key)
    await decryptField(record.enc_addr, key)
  } catch (err) {
    gmacValid = false
    errorDetail = 'Thẻ xác thực GMAC không hợp lệ (Dữ liệu bản mã hoặc thẻ Tag bị chỉnh sửa trái phép)!'
  }

  if (!checksumMatches && !errorDetail) {
    errorDetail = 'Mã Hash SHA-256 không khớp với bản ghi gốc trong cơ sở dữ liệu!'
  }

  return {
    isValid: checksumMatches && gmacValid,
    checksumMatches,
    gmacValid,
    errorDetail,
  }
}

// Simulate DB Tampering by altering 1 byte in ciphertext
export function simulateTamperRecord(
  record: EncryptedOrderRecord
): EncryptedOrderRecord {
  // Flip the first character of enc_addr ciphertextHex
  const originalCipher = record.enc_addr.ciphertextHex
  const tamperedCipher =
    (originalCipher[0] === 'a' ? 'b' : 'a') + originalCipher.substring(1)

  return {
    ...record,
    enc_addr: {
      ...record.enc_addr,
      ciphertextHex: tamperedCipher,
    },
    isTampered: true,
    tamperedDetails: 'Cố tình sửa đổi 1 byte trong trường enc_addr (Ciphertext bị thay đổi)',
  }
}

// Restore record to valid state
export async function restoreTamperedRecord(
  record: EncryptedOrderRecord,
  originalPlaintext: { name: string; phone: string; address: string }
): Promise<EncryptedOrderRecord> {
  const encName = await encryptField(originalPlaintext.name)
  const encPhone = await encryptField(originalPlaintext.phone)
  const encAddr = await encryptField(originalPlaintext.address)
  const blindIndex = await computeBlindIndex(originalPlaintext.phone)
  const checksum = await computeRecordChecksum({
    orderCode: record.orderCode,
    enc_name: encName,
    enc_phone: encPhone,
    enc_addr: encAddr,
    phone_blind_index: blindIndex,
    total_amount: record.total_amount,
  })

  return {
    ...record,
    enc_name: encName,
    enc_phone: encPhone,
    enc_addr: encAddr,
    phone_blind_index: blindIndex,
    record_checksum: checksum,
    isTampered: false,
    tamperedDetails: undefined,
  }
}
