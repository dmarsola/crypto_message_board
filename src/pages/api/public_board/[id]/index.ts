import { defaultReportData } from '@/constants/general'
import { verifyPublicMessage } from '@/lib/crypto/digital_signatures'
import { Message, ReportData } from '@/types/general'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = Message[] | { error: string } | { challenge: string } | { valid: boolean } | { message: string }

interface StoredMessage {
  text: string
  signature: string
  timestamp: number
  ttl: number // in hours
}

const boards: Record<string, StoredMessage[]> = {}
const boardNickname: Record<string, string> = (globalThis._publicBoardNicknames = globalThis._publicBoardNicknames || {})
const challenges: Record<string, string> = (globalThis._publicBoardChallenges = globalThis._publicBoardChallenges || {})
const reportData: ReportData = (globalThis._publicReportData = globalThis._publicReportData || defaultReportData)

const DEFAULT_TTL_HOURS = Number(process.env.TTL_HOURS) || 168 // 7 days default

function pruneExpiredMessages(messages: StoredMessage[]): StoredMessage[] {
  const now = Date.now()
  return messages.filter((msg) => {
    if (now - msg.timestamp < msg.ttl * 3600000) {
      return true
    } else {
      reportData.public_expired_messages += 1
      return false
    }
  })
}

function generateRandomChallenge() {
  return Math.random().toString(36).slice(2, 12) // 10 char random string
}

const resolveID = (id: string): string | undefined => {
  if (boardNickname[id.trim()] !== undefined) {
    return boardNickname[id.trim()]
  } else {
    return id.trim()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing board id' })
    return
  }

  const resolvedId = resolveID(id)
  if (!resolvedId) {
    res.status(400).json({ error: 'Could not resolve board id' })
    return
  }

  // GET with ?challenge=true returns a new challenge string
  // TODO: move this to the verify endpoint
  if (req.method === 'GET') {
    if (req.query.challenge === 'true') {
      const challenge = generateRandomChallenge()
      challenges[resolvedId] = challenge
      res.status(200).json({ challenge })
      return
    }
    if (resolvedId === undefined) {
      res.status(404).json({ error: 'ID not found' })
    } else {
      if (!boards[resolvedId]) {
        // Initialize board
        reportData.public_boards += 1
        boards[resolvedId] = []
      }

      // Prune expired messages before returning
      boards[resolvedId] = pruneExpiredMessages(boards[resolvedId])
      reportData.public_board_views += 1
      res.status(200).json(boards[resolvedId].map(({ text, timestamp }) => ({ text, timestamp })))
    }
    return
  }

  if (req.method === 'POST') {
    const { message, signature, challenge, ttl } = req.body

    if (!message || !signature || !challenge) {
      res.status(400).json({ error: 'Missing message, signature or challenge' })
      return
    }

    if (!challenges[resolvedId] || challenges[resolvedId] !== challenge) {
      res.status(403).json({ error: 'Invalid or expired challenge' })
      return
    }

    // Verify signature using board public key (board id)
    const valid = verifyPublicMessage(message, signature, resolvedId)
    if (!valid) {
      res.status(403).json({ error: 'Invalid signature' })
      return
    }

    // Challenge can only be used once
    delete challenges[resolvedId]

    let messageTtl = DEFAULT_TTL_HOURS
    if (typeof ttl === 'number' && ttl >= 1 && ttl <= 168) {
      messageTtl = ttl
    }

    boards[resolvedId].push({
      text: message,
      signature,
      timestamp: Date.now(),
      ttl: messageTtl,
    })
    reportData.public_board_messages_posted += 1
    res.status(201).json({ message: 'Message saved' })
    return
  }

  if (req.method === 'PATCH') {
    const { nickname } = req.body

    if (!nickname || typeof nickname !== 'string') {
      res.status(400).json({ error: 'Invalid Board Nickname' })
      return
    }

    if (nickname.trim() in boardNickname) {
      res.status(400).json({ error: 'Nickname already in use' })
      return
    }

    boardNickname[nickname.trim()] = resolvedId
    reportData.public_board_nicknames += 1
    res.status(201).json({ message: 'Nickname saved' })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
