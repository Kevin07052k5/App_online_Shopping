export interface CiphertextPackage {
  ciphertextHex: string
  ivHex: string
  authTagHex: string
}

export interface EncryptedPIIPackage {
  customerName: CiphertextPackage
  phoneNumber: CiphertextPackage
  deliveryAddress: CiphertextPackage
  cardNumber?: CiphertextPackage
}

export interface IntegrityReport {
  isValid: boolean
  checksumMatches: boolean
  gmacValid: boolean
  tamperedField?: string
  errorDetails?: string
}
