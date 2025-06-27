import { generateSigningKeyPair, signPublicMessage } from '@/lib/crypto/digital_signatures'
import { Message } from '@/types/general'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function PublicBoardPage() {
  const router = useRouter()
  const { id } = router.query

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [secretWord, setSecretWord] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [date, setDate] = useState('')
  const [ttl, setTtl] = useState(168)
  const [sortNewestFirst, setSortNewestFirst] = useState(true)
  const [challenge, setChallenge] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  const fetchMessages = async () => {
    if (!id) return
    try {
      const res = await axios.get(`/api/public_board/${id}`)
      setMessages(res.data.filter((m: Message) => m.text.length > 0))
    } catch {
      setMessages([])
    }
  }

  const clearForm = () => {
    setInput('')
    setSecretWord('')
    setSecretCode('')
    setDate('')
    setTtl(168)
  }

  useEffect(() => {
    if (id) {
      fetchMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleVerify = async () => {
    try {
      const { privateKey } = generateSigningKeyPair(secretWord, secretCode, date)
      const challengeRes = await axios.get(`/api/public_board/${id}?challenge=true`)
      const serverChallenge = challengeRes.data.challenge // renamed here
      const signature = signPublicMessage(serverChallenge, privateKey)

      const verifyRes = await axios.post(`/api/public_board/${id}/verify`, {
        challenge: serverChallenge,
        signature,
      })

      if (verifyRes.data.valid) {
        setChallenge(serverChallenge)
        setIsVerified(true)
      } else {
        alert('Verification failed')
      }
    } catch (err) {
      console.error(err)
      alert('Verification failed')
    }
  }

  const handleSend = async () => {
    if (!input || input.length == 0) {
      alert('Please add a message')
      return
    }
    try {
      if (!challenge) {
        alert('You need to verify first')
        return
      }

      const { privateKey } = generateSigningKeyPair(secretWord, secretCode, date)
      const signature = signPublicMessage(input, privateKey)

      await axios.post(`/api/public_board/${id}`, {
        message: input,
        signature,
        challenge,
        ttl,
      })
      clearForm()
      setIsVerified(false)
      fetchMessages()
    } catch (err) {
      console.error(err)
      alert('Failed to send message')
    }
  }

  const sortedMessages = [...messages].sort((a, b) => (sortNewestFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp))

  return (
    <div className="container mt-4">
      <h1>Public Message Board</h1>
      <p>Anyone with the link can read messages from this board, but only one can post to it.</p>

      <div className="alert alert-info">
        Messages older than <strong>{ttl}</strong> hour(s) will be automatically deleted.
      </div>

      {isVerified ? (
        <h4>You have proven your can post to this board. Say something worthy.</h4>
      ) : (
        <>
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
          <div className="row align-items-start mb-3">
            <div className="col">
              <button onClick={handleVerify} className="btn btn-primary mb-4">
                Verify Identity to Post
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
        </>
      )}

      <div className="mb-5" style={{ minHeight: 200 }}>
        {sortedMessages.map((msg, idx) => (
          <div key={idx} className="mb-3 p-2 border rounded">
            <small className="text-muted">{new Date(msg.timestamp).toLocaleString()}</small>
            <div className="text-wrap text-break">{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="fixed-bottom bg-light p-3 border-top  mt-mb-5">
        <div className="d-flex flex-column flex-md-row">
          <input
            type="text"
            className="form-control me-2 flex-grow-1  mb-2 mb-md-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={400}
            placeholder="Type a message..."
            disabled={!isVerified}
          />
          <label className="me-2">Expiry (hours)</label>
          <input
            type="number"
            className="w-auto me-2 form-control  mb-2 mb-md-0"
            min={1}
            max={168}
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
          />
          <button className="btn btn-success" onClick={handleSend} disabled={!isVerified}>
            Post
          </button>
        </div>
      </div>
    </div>
  )
}
