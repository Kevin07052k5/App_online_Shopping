import {
  CiphertextPackage,
  EncryptedPIIPackage,
  IntegrityReport,
} from '@/src/types/crypto'
import { CustomerPII, EncryptedOrder } from '@/src/types/order'
import { bufferToHex, hexToBuffer } from '@/src/utils/helpers'

const MASTER_VAULT_PASSPHRASE = 'MARKETPLACE_SHOPEE_LAZADA_MASTER_KEY_2026'
const MASTER_PBKDF2_SALT = 'COMMERCE_SECURITY_SALT_992'
const BLIND_INDEX_HMAC_SECRET = 'BLIND_INDEX_HMAC_SECRET_MARKETPLACE_2026'

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto as Crypto
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Web Crypto API (subtle) requires a secure context (HTTPS or localhost). Please run on http://localhost:3000')
  }
  throw new Error('Web Crypto API is not supported in this runtime')
}

let cachedMasterKey: CryptoKey | null = null
let cachedHmacKey: CryptoKey | null = null

/**
 * Derive AES-GCM 256-bit Key from master passphrase using PBKDF2 (100,000 iterations)
 * Uses in-memory caching for high performance across multiple field encryptions
 */
export async function getMasterCryptoKey(): Promise<CryptoKey> {
  if (cachedMasterKey) return cachedMasterKey
  const enc = new TextEncoder()
  const cryptoObj = getCrypto()
  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(MASTER_VAULT_PASSPHRASE) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  cachedMasterKey = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(MASTER_PBKDF2_SALT) as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  return cachedMasterKey
}

/**
 * Encrypt a single string using AES-256-GCM with a random 12-byte IV
 */
export async function encryptSingleField(
  plaintext: string,
  key?: CryptoKey
): Promise<CiphertextPackage> {
  const cryptoKey = key || (await getMasterCryptoKey())
  const enc = new TextEncoder()
  const safePlaintext = typeof plaintext === 'string' ? plaintext : String(plaintext ?? '')
  const plaintextBytes = enc.encode(safePlaintext)

  const cryptoObj = getCrypto()
  const iv = cryptoObj.getRandomValues(new Uint8Array(12))

  // In Web Crypto API AES-GCM, subtle.encrypt outputs: [ciphertext | 16-byte auth tag]
  const encryptedBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128, // 16 bytes auth tag
    },
    cryptoKey,
    plaintextBytes as unknown as BufferSource
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)
  const tagLengthBytes = 16
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - tagLengthBytes)
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - tagLengthBytes)

  return {
    ciphertextHex: bufferToHex(ciphertextBytes),
    ivHex: bufferToHex(iv),
    authTagHex: bufferToHex(tagBytes),
  }
}

export const encryptField = encryptSingleField

/**
 * Decrypt a single field using AES-256-GCM.
 * Supports both function signatures:
 *   1) decryptOrderPIIField(ciphertextHex, ivHex, authTagHex, key?)
 *   2) decryptOrderPIIField(package: CiphertextPackage, key?)
 *
 * Throws OperationError if ciphertext or auth tag is tampered even by 1 bit!
 */
export async function decryptOrderPIIField(
  ciphertextOrPkg: string | CiphertextPackage,
  ivHexOrKey?: string | CryptoKey,
  authTagHex?: string,
  key?: CryptoKey
): Promise<string> {
  let ciphertextHex = ''
  let ivHex = ''
  let tagHex = ''
  let cryptoKey: CryptoKey | undefined = key

  if (typeof ciphertextOrPkg === 'object' && ciphertextOrPkg !== null) {
    // Called with CiphertextPackage: (pkg, key?)
    ciphertextHex = ciphertextOrPkg.ciphertextHex || ''
    ivHex = ciphertextOrPkg.ivHex || ''
    tagHex = ciphertextOrPkg.authTagHex || (ciphertextOrPkg as any).tagHex || ''
    if (ivHexOrKey && typeof ivHexOrKey === 'object') {
      cryptoKey = ivHexOrKey as CryptoKey
    }
  } else {
    // Called with separate arguments: (ciphertextHex, ivHex, authTagHex, key?)
    ciphertextHex = typeof ciphertextOrPkg === 'string' ? ciphertextOrPkg : String(ciphertextOrPkg ?? '')
    ivHex = typeof ivHexOrKey === 'string' ? ivHexOrKey : ''
    tagHex = typeof authTagHex === 'string' ? authTagHex : ''
  }

  // If empty (e.g. optional unencrypted field), return empty string
  if (!ciphertextHex && !tagHex && !ivHex) {
    return ''
  }

  // If ivHex or tagHex is missing for encrypted ciphertext, it's corrupted/tampered
  if (!ivHex || !tagHex) {
    throw new Error('Dữ liệu mã hóa không hợp lệ: thiếu IV hoặc GMAC Auth Tag!')
  }

  const activeKey = cryptoKey || (await getMasterCryptoKey())
  const ivBytes = hexToBuffer(ivHex)
  const ciphertextBytes = hexToBuffer(ciphertextHex)
  const tagBytes = hexToBuffer(tagHex)

  // GMAC tag must be 16 bytes (128 bits) and IV must be present
  if (tagBytes.length !== 16 || ivBytes.length === 0) {
    throw new Error('Dữ liệu mã hóa bị hỏng: GMAC Tag hoặc IV có độ dài không hợp lệ!')
  }

  // Recombine ciphertext and tag for SubtleCrypto
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length)
  combined.set(ciphertextBytes, 0)
  combined.set(tagBytes, ciphertextBytes.length)

  const cryptoObj = getCrypto()
  const decryptedBuffer = await cryptoObj.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
      tagLength: 128,
    },
    activeKey,
    combined as unknown as BufferSource
  )

  const dec = new TextDecoder()
  return dec.decode(decryptedBuffer)
}

// Aliases for compatibility
export const decryptOrderPII = decryptOrderPIIField
export const decryptField = decryptOrderPIIField

/**
 * Encrypt entire Customer PII package (name, phone, address, card)
 */
export async function encryptOrderPII(
  piiData: CustomerPII
): Promise<EncryptedPIIPackage> {
  const key = await getMasterCryptoKey()

  const customerName = await encryptSingleField(piiData.customerName, key)
  const phoneNumber = await encryptSingleField(piiData.phoneNumber, key)
  const deliveryAddress = await encryptSingleField(piiData.deliveryAddress, key)

  let cardNumber: CiphertextPackage | undefined
  if (piiData.cardNumber) {
    cardNumber = await encryptSingleField(piiData.cardNumber, key)
  }

  return {
    customerName,
    phoneNumber,
    deliveryAddress,
    cardNumber,
  }
}

/**
 * Decrypt entire Customer PII package with GMAC authentication
 */
export async function decryptEntireOrderPII(
  pkg: EncryptedPIIPackage,
  customerEmail: string
): Promise<CustomerPII> {
  const key = await getMasterCryptoKey()

  const customerName = await decryptOrderPIIField(
    pkg.customerName.ciphertextHex,
    pkg.customerName.ivHex,
    pkg.customerName.authTagHex,
    key
  )

  const phoneNumber = await decryptOrderPIIField(
    pkg.phoneNumber.ciphertextHex,
    pkg.phoneNumber.ivHex,
    pkg.phoneNumber.authTagHex,
    key
  )

  const deliveryAddress = await decryptOrderPIIField(
    pkg.deliveryAddress.ciphertextHex,
    pkg.deliveryAddress.ivHex,
    pkg.deliveryAddress.authTagHex,
    key
  )

  let cardNumber: string | undefined
  if (pkg.cardNumber && (pkg.cardNumber.ciphertextHex || pkg.cardNumber.authTagHex)) {
    cardNumber = await decryptOrderPIIField(
      pkg.cardNumber.ciphertextHex,
      pkg.cardNumber.ivHex,
      pkg.cardNumber.authTagHex,
      key
    )
  }

  return {
    customerName,
    phoneNumber,
    deliveryAddress,
    customerEmail,
    cardNumber,
  }
}

/**
 * Compute Blind Index (HMAC-SHA256) on normalized phone number for O(1) searches without decryption
 */
export async function computeBlindIndex(plaintext: string): Promise<string> {
  const safePlaintext = typeof plaintext === 'string' ? plaintext : String(plaintext ?? '')
  let normalized = safePlaintext.replace(/[\s().-]/g, '').trim()
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3)
  } else if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = '0' + normalized.slice(2)
  }

  const enc = new TextEncoder()
  const cryptoObj = getCrypto()

  if (!cachedHmacKey) {
    cachedHmacKey = await cryptoObj.subtle.importKey(
      'raw',
      enc.encode(BLIND_INDEX_HMAC_SECRET) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
  }

  const signature = await cryptoObj.subtle.sign(
    'HMAC',
    cachedHmacKey,
    enc.encode(normalized) as unknown as BufferSource
  )

  return bufferToHex(signature)
}

/**
 * Compute SHA-256 Checksum over critical order state as a tamper-evident seal
 */
export async function computeRecordChecksum(record: {
  orderCode: string
  encryptedPII: EncryptedPIIPackage
  phoneBlindIndex: string
  finalTotalAmount: number
}): Promise<string> {
  const canonicalString = JSON.stringify({
    orderCode: record.orderCode,
    nameCipher: record.encryptedPII.customerName.ciphertextHex,
    nameTag: record.encryptedPII.customerName.authTagHex,
    phoneCipher: record.encryptedPII.phoneNumber.ciphertextHex,
    phoneTag: record.encryptedPII.phoneNumber.authTagHex,
    addrCipher: record.encryptedPII.deliveryAddress.ciphertextHex,
    addrTag: record.encryptedPII.deliveryAddress.authTagHex,
    cardCipher: record.encryptedPII.cardNumber?.ciphertextHex || '',
    blindIndex: record.phoneBlindIndex,
    amount: record.finalTotalAmount,
  })

  const enc = new TextEncoder()
  const cryptoObj = getCrypto()
  const hashBuffer = await cryptoObj.subtle.digest(
    'SHA-256',
    enc.encode(canonicalString) as unknown as BufferSource
  )

  return bufferToHex(hashBuffer)
}

/**
 * Verify both SHA-256 Checksum and AES-GCM GMAC Auth Tags
 */
export async function verifyOrderIntegrity(
  order: EncryptedOrder
): Promise<IntegrityReport> {
  // 1. Check SHA-256 record hash
  const computedHash = await computeRecordChecksum({
    orderCode: order.orderCode,
    encryptedPII: order.encryptedPII,
    phoneBlindIndex: order.phoneBlindIndex,
    finalTotalAmount: order.finalTotalAmount,
  })

  const checksumMatches = computedHash === order.recordChecksum

  // 2. Validate GMAC authentication tags by attempting decryption
  let gmacValid = true
  let tamperedField = ''
  let errorDetails = ''

  try {
    const key = await getMasterCryptoKey()
    await decryptOrderPIIField(
      order.encryptedPII.customerName.ciphertextHex,
      order.encryptedPII.customerName.ivHex,
      order.encryptedPII.customerName.authTagHex,
      key
    )
  } catch {
    gmacValid = false
    tamperedField = 'customerName'
    errorDetails = 'GMAC Tag kiểm thực của trường Tên khách hàng không hợp lệ!'
  }

  if (gmacValid) {
    try {
      const key = await getMasterCryptoKey()
      await decryptOrderPIIField(
        order.encryptedPII.phoneNumber.ciphertextHex,
        order.encryptedPII.phoneNumber.ivHex,
        order.encryptedPII.phoneNumber.authTagHex,
        key
      )
    } catch {
      gmacValid = false
      tamperedField = 'phoneNumber'
      errorDetails = 'GMAC Tag kiểm thực của trường Số điện thoại không hợp lệ!'
    }
  }

  if (gmacValid) {
    try {
      const key = await getMasterCryptoKey()
      await decryptOrderPIIField(
        order.encryptedPII.deliveryAddress.ciphertextHex,
        order.encryptedPII.deliveryAddress.ivHex,
        order.encryptedPII.deliveryAddress.authTagHex,
        key
      )
    } catch {
      gmacValid = false
      tamperedField = 'deliveryAddress'
      errorDetails = 'GMAC Tag kiểm thực của trường Địa chỉ giao hàng không hợp lệ!'
    }
  }

  if (gmacValid && order.encryptedPII.cardNumber && (order.encryptedPII.cardNumber.ciphertextHex || order.encryptedPII.cardNumber.authTagHex)) {
    try {
      const key = await getMasterCryptoKey()
      await decryptOrderPIIField(
        order.encryptedPII.cardNumber.ciphertextHex,
        order.encryptedPII.cardNumber.ivHex,
        order.encryptedPII.cardNumber.authTagHex,
        key
      )
    } catch {
      gmacValid = false
      tamperedField = 'cardNumber'
      errorDetails = 'GMAC Tag kiểm thực của trường Thẻ tín dụng không hợp lệ!'
    }
  }

  if (!checksumMatches && !errorDetails) {
    errorDetails = 'Mã Hash SHA-256 không khớp với bản niêm phong ban đầu trên CSDL!'
    if (!tamperedField) {
      tamperedField = 'recordChecksum'
    }
  }

  return {
    isValid: checksumMatches && gmacValid,
    checksumMatches,
    gmacValid,
    tamperedField,
    errorDetails,
  }
}

export const verifyRecordIntegrity = verifyOrderIntegrity

/**
 * Simulate DB Tampering by altering 1 byte in deliveryAddress ciphertext
 */
export function simulateTamperCiphertext(order: EncryptedOrder): EncryptedOrder {
  const originalCipher = order.encryptedPII.deliveryAddress?.ciphertextHex || 'e8c6'
  // Invert the first character (e.g. 'a' -> 'b', '1' -> '2')
  const firstChar = originalCipher.charAt(0)
  const tamperedChar = firstChar === 'a' ? 'b' : 'a'
  const tamperedCipher = tamperedChar + originalCipher.substring(1)

  return {
    ...order,
    encryptedPII: {
      ...order.encryptedPII,
      deliveryAddress: {
        ...order.encryptedPII.deliveryAddress,
        ciphertextHex: tamperedCipher,
      },
    },
    isTampered: true,
    tamperedDescription: 'Cố tình sửa đổi 1 byte trong trường Ciphertext của Địa chỉ giao hàng (enc_addr)',
  }
}

/**
 * Restore tampered order to clean, valid state
 */
export async function restoreTamperedOrder(
  order: EncryptedOrder,
  originalPII: CustomerPII
): Promise<EncryptedOrder> {
  const encPII = await encryptOrderPII(originalPII)
  const blindIndex = await computeBlindIndex(originalPII.phoneNumber)
  const checksum = await computeRecordChecksum({
    orderCode: order.orderCode,
    encryptedPII: encPII,
    phoneBlindIndex: blindIndex,
    finalTotalAmount: order.finalTotalAmount,
  })

  return {
    ...order,
    encryptedPII: encPII,
    phoneBlindIndex: blindIndex,
    recordChecksum: checksum,
    isTampered: false,
    tamperedDescription: undefined,
  }
}
