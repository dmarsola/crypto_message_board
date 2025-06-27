import { generateKeyPair } from '@/lib/crypto/asymetric_encryption'
import { generateSigningKeyPair } from '@/lib/crypto/digital_signatures'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [secretWord, setSecretWord] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [date, setDate] = useState('')
  const [boardType, setBoardType] = useState<'private' | 'public'>('private')

  const handleCreate = async () => {
    if (!secretWord || secretWord.length == 0 || !secretCode || secretCode.length == 0 || !date || date.length == 0) {
      alert('Please fill in all fields')
      return
    }

    if (boardType === 'public') {
      // Use signing keys
      const { publicKey } = generateSigningKeyPair(secretWord, secretCode, date)
      // Trigger challenge creation to force backend initialization
      await axios.get(`/api/public_board/${publicKey}?challenge=true`).catch(() => {})
      router.push(`/public_board/${publicKey}`)
    } else {
      // Use encryption keys
      const { publicKey } = generateKeyPair(secretWord, secretCode, date)
      // Trigger empty board creation
      // await axios.post(`/api/private_board/${publicKey}`, { message: '', ttl: 1 }).catch(() => {})
      router.push(`/private_board/${publicKey}`)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="container" style={{ maxWidth: 500 }}>
        <h1 className="text-center mb-4">Create a Message Board</h1>
        <div className="mb-3">
          <label className="form-label">Secret Word</label>
          <input type="text" className="form-control" value={secretWord} onChange={(e) => setSecretWord(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Secret Code</label>
          <input type="text" className="form-control" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Special Date</label>
          <input type="date" className="form-control" value={date} min="0001-01-01" max="9999-12-31" onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label">Message Board Type</label>
          <select className="form-select" value={boardType} onChange={(e) => setBoardType(e.target.value as 'private' | 'public')}>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
        <h4 className="text-center">Private message board</h4>
        <p className="text-center">Anyone with the link can post to it, but only you can read it.</p>
        <h4 className="text-center">Public message board</h4>
        <p className="text-center">Anyone with the link can read it, but only you can post to it.</p>

        <button className="btn btn-primary w-100" onClick={handleCreate}>
          Create Board
        </button>
      </div>
    </div>
  )
}
