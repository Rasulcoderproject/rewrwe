import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')

  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!token || !appUrl) {
    return NextResponse.json({ error: 'env not configured' }, { status: 500 })
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${appUrl}/api/telegram-webhook`,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      drop_pending_updates: true,
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
