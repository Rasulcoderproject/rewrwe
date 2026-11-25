import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { sessionId?: unknown; text?: unknown }
    const sessionId = body.sessionId
    const text = body.text

    if (typeof sessionId !== 'string' || !/^[a-z0-9]{6,32}$/i.test(sessionId)) {
      return NextResponse.json({ error: 'bad session' }, { status: 400 })
    }
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
      return NextResponse.json({ error: 'bad text' }, { status: 400 })
    }

    const rlKey = `rl:${sessionId}`
    const blocked = await redis.get(rlKey)
    if (blocked) {
      return NextResponse.json({ error: 'too fast' }, { status: 429 })
    }
    await redis.set(rlKey, '1', { ex: 3 })

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) {
      return NextResponse.json({ error: 'server not configured' }, { status: 500 })
    }

    const formatted = `[#${sessionId}]\n\n${text}`

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatted,
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Telegram error:', err)
      return NextResponse.json({ error: 'telegram rejected' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Send error:', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}


import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { sessionId?: unknown; text?: unknown }
    const sessionId = body.sessionId
    const text = body.text

    if (typeof sessionId !== 'string' || !/^[a-z0-9]{6,32}$/i.test(sessionId)) {
      return NextResponse.json({ error: 'bad session' }, { status: 400 })
    }
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
      return NextResponse.json({ error: 'bad text' }, { status: 400 })
    }

    const rlKey = `rl:${sessionId}`
    const blocked = await redis.get(rlKey)
    if (blocked) {
      return NextResponse.json({ error: 'too fast' }, { status: 429 })
    }
    await redis.set(rlKey, '1', { ex: 3 })

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) {
      return NextResponse.json({ error: 'server not configured' }, { status: 500 })
    }

    const formatted = `[#${sessionId}]\n\n${text}`

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatted,
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Telegram error:', err)
      return NextResponse.json({ error: 'telegram rejected' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Send error:', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}


