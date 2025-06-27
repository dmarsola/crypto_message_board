import { formatPrivateKey, hexToUint8, padMessage, uint8ToHex, unpadMessage } from './utils'
import { createHash } from 'crypto'
import nacl from 'tweetnacl'

export const generateKeyPair = (username: string, secret: string, date: string) => {
  const privateKeySeed = createHash('sha256')
    .update(formatPrivateKey(username, secret, date))
    .digest()

  if (privateKeySeed.length !== 32) {
    throw new Error('Seed must be exactly 32 bytes')
  }

  // Use box.keyPair.fromSecretKey (requires 32-byte private key)
  const keyPair = nacl.box.keyPair.fromSecretKey(privateKeySeed)

  return {
    publicKey: uint8ToHex(keyPair.publicKey),
    privateKey: uint8ToHex(keyPair.secretKey),
  }
}

export const encryptForPrivateBoard = (message: string, recipientPublicKeyHex: string): string => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const recipientPublicKey = hexToUint8(recipientPublicKeyHex)
  const ephemeralKeyPair = nacl.box.keyPair()
  const paddedMessage = padMessage(message)
  const messageBytes = new TextEncoder().encode(paddedMessage)

  const ciphertext = nacl.box(messageBytes, nonce, recipientPublicKey, ephemeralKeyPair.secretKey)

  return JSON.stringify({
    nonce: uint8ToHex(nonce),
    ephemeralPublicKey: uint8ToHex(ephemeralKeyPair.publicKey),
    ciphertext: uint8ToHex(ciphertext),
  })
}

export const decryptFromPrivateBoard = (encrypted: string, recipientPrivateKeyHex: string): string => {
  const { nonce, ephemeralPublicKey, ciphertext } = JSON.parse(encrypted)

  const nonceBytes = hexToUint8(nonce)
  const publicKeyBytes = hexToUint8(ephemeralPublicKey)
  const ciphertextBytes = hexToUint8(ciphertext)

  const fullPrivateKeyBytes = hexToUint8(recipientPrivateKeyHex)
  const privateKeyBytes = fullPrivateKeyBytes.slice(0, 32)

  const decrypted = nacl.box.open(ciphertextBytes, nonceBytes, publicKeyBytes, privateKeyBytes)
  if (!decrypted) throw new Error('Decryption failed')

  return unpadMessage(new TextDecoder().decode(decrypted))
}
