import { formatPrivateKey, hexToUint8, uint8ToHex } from './utils'
import { createHash } from 'crypto'
import nacl from 'tweetnacl'

export const generateSigningKeyPair = (username: string, secret: string, date: string) => {
  const seed = createHash('sha256')
    .update(formatPrivateKey(username, secret, date))
    .digest()

  if (seed.length !== 32) {
    throw new Error('Seed must be exactly 32 bytes')
  }

  const keyPair = nacl.sign.keyPair.fromSeed(seed)

  return {
    publicKey: uint8ToHex(keyPair.publicKey),
    privateKey: uint8ToHex(keyPair.secretKey),
  }
}

export const signPublicMessage = (message: string, privateKeyHex: string): string => {
  const privateKey = hexToUint8(privateKeyHex)

  if (privateKey.length !== 64) {
    throw new Error('Signing private key must be 64 bytes')
  }

  const messageBytes = new TextEncoder().encode(message)
  const signature = nacl.sign.detached(messageBytes, privateKey)
  return uint8ToHex(signature)
}

export const verifyPublicMessage = (message: string, signatureHex: string, publicKeyHex: string): boolean => {
  const messageBytes = new TextEncoder().encode(message)
  const signature = hexToUint8(signatureHex)
  const publicKey = hexToUint8(publicKeyHex)

  return nacl.sign.detached.verify(messageBytes, signature, publicKey)
}
