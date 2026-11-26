import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

type TgUpdate = {
  message?: {
    chat?: { id?: number | string }
    text?: string
    reply_to_message?: { text?: string }
  }
}

export async function GET(req: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token')

  if (expectedSecret && incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const update = (await req.json()) as TgUpdate
    const msg = update.message
    if (!msg) return NextResponse.json({ ok: true })

    const chatId = process.env.TELEGRAM_CHAT_ID
    if (String(msg.chat?.id) !== String(chatId)) {
      return NextResponse.json({ ok: true })
    }

    const replyTo = msg.reply_to_message
    if (!replyTo?.text) return NextResponse.json({ ok: true })

    const match = replyTo.text.match(/\[#([a-z0-9]+)\]/i)
    if (!match) return NextResponse.json({ ok: true })
    const sessionId = match[1].toLowerCase()

    const replyText = typeof msg.text === 'string' ? msg.text.slice(0, 4000) : ''
    if (!replyText) return NextResponse.json({ ok: true })

    const key = `reply:${sessionId}`
    await redis.rpush(key, replyText)
    await redis.expire(key, 600)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json({ ok: true })
  }
}
