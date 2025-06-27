import { randomBytes } from 'crypto'

const MAX_LENGTH = 404

export const hexToUint8 = (hex: string): Uint8Array => {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
}

export const uint8ToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const formatPrivateKey = (word: string, code: string, date: string) => {
  return `${word.trim()}:${code.trim()}:${date.trim()}`
}

// First iteration of the pad/unpad logic
// export const padMessage = (msg: string, length = MAX_LENGTH): string => msg.padEnd(length, '\0')
// export const unpadMessage = (msg: string): string => msg.replace(/\0+$/, '')
// improved pad/unpad logic
export const padMessage = (msg: string, length = MAX_LENGTH): string => {
  if (msg.length > length - 4) {
    throw new Error(`Message too long! Must be <= ${length - 4} characters.`)
  }

  const lengthPrefix = msg.length.toString().padStart(4, '0')
  const remaining = length - 4 - msg.length

  const randomString = randomBytes(Math.ceil(remaining / 2))
    .toString('base64')
    .slice(0, remaining)

  return lengthPrefix + msg + randomString
}

export const unpadMessage = (padded: string): string => {
  const length = parseInt(padded.slice(0, 4), 10)
  return padded.slice(4, 4 + length)
}
