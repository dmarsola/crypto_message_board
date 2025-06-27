import { decryptFromPrivateBoard, encryptForPrivateBoard, generateKeyPair } from '@/lib/crypto/asymetric_encryption'
import { Message, NaclData } from '@/types/general'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function PrivateBoardPage() {
  const router = useRouter()
  const { id } = router.query

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [secretWord, setSecretWord] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [date, setDate] = useState('')
  const [decodedMessages, setDecodedMessages] = useState<string[]>([])
  const [ttl, setTtl] = useState(168) // default 7 days
  const [sortNewestFirst, setSortNewestFirst] = useState(true)

  const fetchMessages = async () => {
    if (!id) return
    try {
      const res = await axios.get(`/api/private_board/${id}`)
      setMessages(res.data.filter((m: Message) => m.text.length > 0))
    } catch {
      setMessages([])
    }
  }

  useEffect(() => {
    if (id) {
      fetchMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDecode = () => {
    try {
      const { privateKey } = generateKeyPair(secretWord, secretCode, date)
      const decoded = messages.map((m) => {
        try {
          return decryptFromPrivateBoard(m.text, privateKey)
        } catch {
          return '[Undecodable]'
        }
      })
      setDecodedMessages(decoded)
    } catch (err: unknown) {
      console.error(err)
      alert('Failed to decode messages')
    }
  }

  const handleSend = async () => {
    const publicKey = id as string
    const encrypted = encryptForPrivateBoard(input, publicKey)
    await axios.post(`/api/private_board/${id}`, {
      message: encrypted,
      ttl,
    })
    setInput('')
    fetchMessages()
  }

  const sortedMessages = [...messages].sort((a, b) => (sortNewestFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp))

  return (
    <div className="container mt-4">
      <h1>Private Message Board</h1>
      <p>Anyone with the link can post messages to this board, but only one can decode it.</p>

      <div className="alert alert-info">
        Messages older than <strong>{ttl}</strong> hour(s) will be automatically deleted.
      </div>

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
      <div className="row align-items-start">
        <div className="col">
          <button onClick={handleDecode} className="btn btn-primary">
            Decode
          </button>
        </div>
        <div className="col">
          <div className="form-check form-switch">
            <input
              className="form-check-input bigger"
              type="checkbox"
              checked={sortNewestFirst}
              onChange={() => setSortNewestFirst((prev) => !prev)}
              id="sortSwitch"
            />
            <label className="form-check-label ms-2" htmlFor="sortSwitch">
              Newest messages on top
            </label>
          </div>
        </div>
      </div>

      <div className="mb-5 pb-5" style={{ minHeight: 200 }}>
        {sortedMessages.map((msg, idx) => (
          <div key={idx} className="mb-3 p-2 border rounded">
            <small className="text-muted">{new Date(msg.timestamp).toLocaleString()}</small>
            <div className="text-wrap text-break">
              {decodedMessages.length > 0
                ? decodedMessages[idx]
                  ? decodedMessages[idx]
                  : '[Undecodable]'
                : `[Encrypted]: ${(JSON.parse(msg.text) as NaclData).ciphertext}`}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed-bottom bg-light p-3 border-top">
        <div className="d-flex">
          <input
            type="text"
            className="form-control me-2 flex-grow-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={400}
            placeholder="Type a message..."
          />
          <label className="me-2">Expiry (hours)</label>
          <input type="number" className="w-auto me-2 form-control" min={1} max={168} value={ttl} onChange={(e) => setTtl(Number(e.target.value))} />
          <button className="btn btn-success" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
