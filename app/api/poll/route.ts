import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId || !/^[a-z0-9]{6,32}$/i.test(sessionId)) {
      return NextResponse.json({ error: 'bad session' }, { status: 400 })
    }

    const key = `reply:${sessionId}`
    const popped = await redis.lpop<string[]>(key, 20)
    const messages: string[] = popped || []

    return NextResponse.json({ messages })
  } catch (e) {
    console.error('Poll error:', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}