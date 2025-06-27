import { verifyPublicMessage } from '@/lib/crypto/digital_signatures'
import type { NextApiRequest, NextApiResponse } from 'next'

interface Data {
  valid: boolean
  error?: string
}

const challenges: Record<string, string> = (globalThis._publicBoardChallenges = globalThis._publicBoardChallenges || {})

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ valid: false, error: 'Missing board id' })
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ valid: false, error: 'Method not allowed' })
    return
  }

  const { challenge, signature } = req.body

  if (!challenge || !signature) {
    res.status(400).json({ valid: false, error: 'Missing challenge or signature' })
    return
  }

  // Validate challenge
  const expectedChallenge = challenges[id]
  // WARNING - Should not delete the challenge as it is rechecked and deleted when the user posts a message.
  if (!expectedChallenge || expectedChallenge !== challenge) {
    res.status(403).json({ valid: false, error: 'Invalid or expired challenge' })
    return
  }

  // Verify the signature against the board's public key
  const valid = verifyPublicMessage(challenge, signature, id)
  if (!valid) {
    res.status(403).json({ valid: false, error: 'Invalid signature' })
    return
  }

  res.status(200).json({ valid: true })
}
