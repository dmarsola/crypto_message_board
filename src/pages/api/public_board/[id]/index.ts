import { verifyPublicMessage } from '@/lib/crypto/digital_signatures'
import { Message } from '@/types/general'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = Message[] | { error: string } | { challenge: string } | { valid: boolean } | { message: string }

interface StoredMessage {
  text: string
  signature: string
  timestamp: number
  ttl: number // in hours
}

const boards: Record<string, StoredMessage[]> = {}
const challenges: Record<string, string> = (globalThis._publicBoardChallenges = globalThis._publicBoardChallenges || {})

const DEFAULT_TTL_HOURS = Number(process.env.TTL_HOURS) || 168 // 7 days default

function pruneExpiredMessages(messages: StoredMessage[]): StoredMessage[] {
  const now = Date.now()
  return messages.filter((msg) => now - msg.timestamp < msg.ttl * 3600000)
}

function generateRandomChallenge() {
  return Math.random().toString(36).slice(2, 12) // 10 char random string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing board id' })
    return
  }

  if (!boards[id]) {
    boards[id] = []
  }

  // GET with ?challenge=true returns a new challenge string
  // TODO: move this to the verify endpoint
  if (req.method === 'GET') {
    if (req.query.challenge === 'true') {
      const challenge = generateRandomChallenge()
      challenges[id] = challenge
      res.status(200).json({ challenge })
      return
    }
    // Otherwise return messages (pruned)
    boards[id] = pruneExpiredMessages(boards[id])
    res.status(200).json(boards[id].map(({ text, timestamp }) => ({ text, timestamp })))
    return
  }

  if (req.method === 'POST') {
    const { message, signature, challenge, ttl } = req.body

    if (!message || !signature || !challenge) {
      res.status(400).json({ error: 'Missing message, signature or challenge' })
      return
    }

    if (!challenges[id] || challenges[id] !== challenge) {
      res.status(403).json({ error: 'Invalid or expired challenge' })
      return
    }

    // Verify signature using board public key (board id)
    const valid = verifyPublicMessage(message, signature, id)
    if (!valid) {
      res.status(403).json({ error: 'Invalid signature' })
      return
    }

    // Challenge can only be used once
    delete challenges[id]

    let messageTtl = DEFAULT_TTL_HOURS
    if (typeof ttl === 'number' && ttl >= 1 && ttl <= 168) {
      messageTtl = ttl
    }

    boards[id].push({
      text: message,
      signature,
      timestamp: Date.now(),
      ttl: messageTtl,
    })

    res.status(201).json({ message: 'Message saved' })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
