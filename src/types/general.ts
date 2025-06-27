export interface Message {
  text: string
  timestamp: number
  ttl?: number
}

export interface NaclData {
  ciphertext: string
  nonce: string
  ephemeralPublicKey: string
}
