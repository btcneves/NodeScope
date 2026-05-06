import { useEffect, useRef, useState } from 'react'

export interface SSEEvent {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}

const RETRY_DELAYS = [3000, 5000, 10000]
const MAX_RETRIES = 3

export function useSSE(url: string) {
  const [events, setEvents] = useState<SSEEvent[]>([])
  const [connected, setConnected] = useState(false)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    let active = true

    function connect() {
      if (!active) return

      const es = new EventSource(url)
      esRef.current = es

      es.addEventListener('stream_open', () => {
        if (!active) return
        retryCount.current = 0
        setConnected(true)
      })

      es.addEventListener('nodescope_event', (e: MessageEvent) => {
        if (!active) return
        try {
          const payload = JSON.parse(e.data as string)
          setEvents(prev => [{ type: 'nodescope_event', payload }, ...prev].slice(0, 50))
        } catch { /* ignore malformed */ }
      })

      es.onerror = () => {
        if (!active) return
        setConnected(false)
        es.close()

        if (retryCount.current < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount.current] ?? 10000
          retryCount.current += 1
          retryTimer.current = setTimeout(connect, delay)
        }
      }
    }

    connect()

    return () => {
      active = false
      if (retryTimer.current !== null) clearTimeout(retryTimer.current)
      esRef.current?.close()
      setConnected(false)
    }
  }, [url])

  return { events, connected }
}
