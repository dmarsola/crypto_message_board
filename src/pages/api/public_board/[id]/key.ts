import type { NextApiRequest, NextApiResponse } from 'next'

const boardNickname: Record<string, string> = (globalThis._publicBoardNicknames = globalThis._publicBoardNicknames || {})

const resolveID = (id: string): string => {
  if (id in boardNickname) {
    return boardNickname[id]
  } else {
    return id
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
      // Prune expired messages before returning
      res.status(200).json({ id: resolvedId })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
