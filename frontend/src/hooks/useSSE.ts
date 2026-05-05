import { useEffect, useState } from 'react'

export interface SSEEvent {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}

export function useSSE(url: string) {
  const [events, setEvents] = useState<SSEEvent[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource(url)

    es.addEventListener('stream_open', () => setConnected(true))
    es.addEventListener('nodescope_event', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string)
        setEvents(prev => [{ type: 'nodescope_event', payload }, ...prev].slice(0, 50))
      } catch { /* ignore */ }
    })
    es.onerror = () => setConnected(false)

    return () => {
      es.close()
      setConnected(false)
    }
  }, [url])

  return { events, connected }
}
