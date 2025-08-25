import { defaultReportData } from '@/constants/general'
import { Message, ReportData } from '@/types/general'
import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = Message[] | { error: string } | { message: string }

interface StoredMessage {
  text: string
  timestamp: number
  ttl: number // in hours
}

const boards: Record<string, StoredMessage[]> = {}
const boardNickname: Record<string, string> = (globalThis._privateBoardNicknames = globalThis._privateBoardNicknames || {})
const reportData: ReportData = (globalThis._publicReportData = globalThis._publicReportData || defaultReportData)

const DEFAULT_TTL_HOURS = Number(process.env.TTL_HOURS) || 168 // 7 days default

function pruneExpiredMessages(messages: StoredMessage[]): StoredMessage[] {
  const now = Date.now()
  return messages.filter((msg) => {
    if (now - msg.timestamp < msg.ttl * 3600000) {
      return true
    } else {
      reportData.private_expired_messages += 1
      return false
    }
  })
}

const resolveID = (id: string): string | undefined => {
  if (boardNickname[id.trim()] !== undefined) {
    return boardNickname[id.trim()]
  } else {
    return id.trim()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const prisma = new PrismaClient()
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

  if (req.method === 'GET') {
    if (resolvedId === undefined) {
      res.status(404).json({ error: 'ID not found' })
    } else {
      const private_board = await prisma.board.findUnique({
        where: {
          id: resolvedId,
        },
        include: {
          Messages: true,
        },
      })
      console.log('private_board from DB: ', private_board)
      if (!boards[resolvedId]) {
        // Initialize board
        reportData.private_boards += 1
        boards[resolvedId] = []
      } else {
        // Prune expired messages before returning
        boards[resolvedId] = pruneExpiredMessages(boards[resolvedId])
      }
      reportData.private_board_views += 1
      res.status(200).json(boards[resolvedId].map(({ text, timestamp, ttl }) => ({ text, timestamp, ttl })))
    }
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
    boards[resolvedId].push({
      text: message,
      timestamp: Date.now(),
      ttl: messageTtl,
    })
    const private_board = await prisma.message.create({
      data: {
        text: message,
        timestamp: Date.now(),
        ttl: messageTtl,
        boardId: resolvedId,
      },
    })
    console.log('private_board from DB: ', private_board)
    reportData.private_board_messages_posted += 1
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
    reportData.private_board_nicknames += 1
    res.status(201).json({ message: 'Nickname saved' })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
