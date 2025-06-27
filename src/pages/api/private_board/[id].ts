import { Message } from '@/types/general'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = Message[] | { error: string } | { message: string }

interface StoredMessage {
  text: string
  timestamp: number
  ttl: number // in hours
}

const boards: Record<string, StoredMessage[]> = {}

const DEFAULT_TTL_HOURS = Number(process.env.TTL_HOURS) || 168 // 7 days default

function pruneExpiredMessages(messages: StoredMessage[]): StoredMessage[] {
  const now = Date.now()
  return messages.filter((msg) => now - msg.timestamp < msg.ttl * 3600000)
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing board id' })
    return
  }

  // Initialize board if missing
  if (!boards[id]) {
    boards[id] = []
  }

  if (req.method === 'GET') {
    // Prune expired messages before returning
    boards[id] = pruneExpiredMessages(boards[id])
    res.status(200).json(boards[id].map(({ text, timestamp, ttl }) => ({ text, timestamp, ttl })))
    return
  }

  if (req.method === 'POST') {
    const { message, ttl } = req.body

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Invalid message' })
      return
    }

    // Validate TTL (optional: clamp between 1 and 168)
    let messageTtl = DEFAULT_TTL_HOURS
    if (typeof ttl === 'number' && ttl >= 1 && ttl <= 168) {
      messageTtl = ttl
    }

    // Add message with timestamp and TTL
    boards[id].push({
      text: message,
      timestamp: Date.now(),
      ttl: messageTtl,
    })

    res.status(201).json({ message: 'Message saved' })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
