import BootstrapClient from '@/components/bootstrap_client'
import { decryptFromPrivateBoard, encryptForPrivateBoard, generateKeyPair } from '@/lib/crypto/asymetric_encryption'
import { Message, NaclData } from '@/types/general'
import { BootstrapModal, BootstrapTooltip } from '@/types/global'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

export default function PrivateBoardPage() {
  const router = useRouter()
  const { id } = router.query

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [resolvedId, setResolvedId] = useState<string | undefined>(undefined)
  const [canRename, setCanRename] = useState(false)
  const [nickname, setNickname] = useState('')
  const [secretWord, setSecretWord] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [date, setDate] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [decodedMessages, setDecodedMessages] = useState<string[]>([])
  const [ttl, setTtl] = useState(168) // default 7 days
  const [sortNewestFirst, setSortNewestFirst] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const tooltipRef = useRef<HTMLElement>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const modalInstanceRef = useRef<BootstrapModal | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    import('bootstrap').then((bootstrap) => {
      if (modalRef.current) {
        modalInstanceRef.current = new bootstrap.Modal(modalRef.current, {
          backdrop: true,
          keyboard: true,
        })
      }
    })
  }, [isClient])

  const openModal = () => {
    modalInstanceRef.current?.show()
  }

  const closeModal = () => {
    modalInstanceRef.current?.hide()
  }

  const fetchMessages = async () => {
    if (!id) return
    try {
      const res = await axios.get(`/api/private_board/${id}`)
      setMessages(res.data.filter((m: Message) => m.text.length > 0))
    } catch {
      setMessages([])
    }
  }

  const fetchResolvedId = async () => {
    const res = await axios
      .get(`/api/private_board/${id}/key`)
      .then((data) => data.data)
      .catch((err) => {
        console.error(err)
        alert('Cannot resolve board id')
      })
    setResolvedId(res.id.trim())
    if (id?.toString().trim() === res.id) {
      setCanRename(true)
    }
  }

  useEffect(() => {
    if (id) {
      fetchMessages()
      fetchResolvedId()
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
    if (!input || input.length == 0) {
      alert('Please add a message')
      return
    }
    const publicKey = resolvedId as string
    const encrypted = encryptForPrivateBoard(input, publicKey)
    await axios.post(`/api/private_board/${resolvedId}`, {
      message: encrypted,
      ttl,
    })
    setInput('')
    fetchMessages()
  }

  useEffect(() => {
    if (tooltipRef.current) {
      let tooltipTrigger: BootstrapTooltip | null = null
      import('bootstrap/js/dist/tooltip').then(({ default: Tooltip }) => {
        tooltipTrigger = new Tooltip(tooltipRef.current!, {
          title: canRename ? 'Give the Board a human-readable name' : 'Board is already renamed',
          placement: 'top',
        })
      })
      return () => tooltipTrigger?.dispose()
    }
  }, [canRename])

  const sortedMessages = [...messages].sort((a, b) => (sortNewestFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp))

  return (
    <>
      <BootstrapClient />
      <div className="container mt-4">
        <h1>Private Message Board</h1>
        <p>Anyone with the link can post messages to this board, but only one can decode it.</p>

        <div className="alert alert-info">
          Messages older than <strong>{ttl}</strong> hour(s) will be automatically deleted.
        </div>

        <div className="mb-3">
          <label className="form-label">Secret Word</label>
          <input type="password" className="form-control" value={secretWord} onChange={(e) => setSecretWord(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Secret Code</label>
          <input type="password" className="form-control" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Special Date</label>
          <input
            type={showDate ? 'date' : 'password'}
            className="form-control"
            value={date}
            min="0001-01-01"
            max="9999-12-31"
            placeholder="YYYY-MM-DD"
            onChange={(e) => {
              const newDate = e.target.value
              setDate(newDate)
              setShowDate(false)
            }}
            onBlur={() => setShowDate(false)}
            onFocus={() => setShowDate(true)}
          />
        </div>
        <div className="row align-items-start mb-3">
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
          <div className="col">
            <span ref={tooltipRef} tabIndex={0} data-bs-toggle="tooltip">
              <button
                type="button"
                className="btn btn-primary"
                style={{ pointerEvents: canRename ? 'auto' : 'none' }}
                onClick={openModal}
                disabled={!canRename}
              >
                Rename
              </button>
            </span>
          </div>
        </div>
        <div className="modal fade" id="renameModal" tabIndex={-1} aria-labelledby="renameModalLabel" aria-hidden="true" ref={modalRef}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="renameModalLabel">
                  Rename Board
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>Renaming this board makes it easier to share the link</p>
                <input
                  type="text"
                  className="form-control me-2 flex-grow-1  mb-2 mb-md-0"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={100}
                  placeholder="Type a Nickname for this board..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={nickname.length === 0}
                  onClick={async () => {
                    await axios
                      .patch(`/api/private_board/${id}`, { nickname: nickname.trim() })
                      .then((data) => data.data)
                      .catch((err) => {
                        console.error(err)
                        alert('An issue occurred, try again.')
                      })
                    setNickname('')
                    closeModal()
                    // TODO: redirect to board nickname
                    setTimeout(() => {
                      router.push(`/private_board/${nickname.trim()}`)
                    }, 10)
                  }}
                >
                  Save changes
                </button>
              </div>
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

        <div className="fixed-bottom bg-light p-3 border-top mt-mb-5">
          <div className="d-flex flex-column flex-md-row">
            <input
              type="text"
              className="form-control me-2 flex-grow-1 mb-2 mb-md-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={400}
              placeholder="Type a message..."
            />
            <label className="me-2">Expiry (hours)</label>
            <input
              type="number"
              className="w-auto me-2 form-control mb-2 mb-md-0"
              min={1}
              max={168}
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
            />
            <button className="btn btn-success" onClick={handleSend}>
              Post
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
