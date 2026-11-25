'use client'

import { useEffect, useRef, useState } from 'react'

type Message = { id: string; role: 'me' | 'admin'; text: string }

function genSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(12)
  crypto.getRandomValues(arr)
  let s = ''
  for (let i = 0; i < 12; i++) s += chars[arr[i] % chars.length]
  return s
}

function uid(): string {
  return crypto.randomUUID()
}

export default function Home() {
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef('')

  useEffect(() => {
    const id = genSessionId()
    sessionRef.current = id
    setSessionId(id)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    let mounted = true

    async function poll() {
      try {
        const res = await fetch(`/api/poll?sessionId=${sessionRef.current}`, {
          cache: 'no-store',
        })
        if (!mounted) return
        if (!res.ok) { setOnline(false); return }
        const data = (await res.json()) as { messages?: string[] }
        setOnline(true)
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((prev) => [
            ...prev,
            ...data.messages!.map((t) => ({ id: uid(), role: 'admin' as const, text: t })),
          ])
        }
      } catch {
        if (mounted) setOnline(false)
      }
    }

    poll()
    const timer = setInterval(poll, 3000)
    return () => { mounted = false; clearInterval(timer) }
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError('')

    const optimistic: Message = { id: uid(), role: 'me', text }
    setMessages((m) => [...m, optimistic])
    setInput('')

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionRef.current, text }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (res.status === 429) setError('Слишком часто. Подождите пару секунд.')
        else setError(data.error || 'Не удалось отправить сообщение.')
        setMessages((m) => m.filter((x) => x.id !== optimistic.id))
      }
    } catch {
      setError('Ошибка сети. Попробуйте снова.')
      setMessages((m) => m.filter((x) => x.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <div className="container">
        <header className="header">
          <div className="logo">
            <span className="logo-dot" />
            <span>anon.chat</span>
          </div>
          <div className={`status ${online ? 'status-online' : 'status-offline'}`}>
            <span className="status-dot" />
            {online ? 'онлайн' : 'нет связи'}
          </div>
        </header>

        <div className="chat-card">
          <div className="messages">
            {messages.length === 0 && (
              <div className="empty">
                <div className="empty-icon">💬</div>
                <h2>Напишите сообщение</h2>
                <p>Никто вас не узнает. Всё исчезнет при закрытии вкладки — ни логов, ни истории.</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`bubble-wrap ${m.role === 'me' ? 'right' : 'left'}`}>
                <div className={`bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <div className="error">{error}</div>}

          <form className="composer" onSubmit={(e) => { e.preventDefault(); send() }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Сообщение..."
              maxLength={2000}
              disabled={sending}
              autoFocus
            />
            <button type="submit" disabled={!input.trim() || sending}>
              {sending ? '…' : '→'}
            </button>
          </form>
        </div>

        <div className="footer">
          <span>ID сессии: <code>{sessionId || '…'}</code></span>
        </div>
      </div>
    </main>
  )
}