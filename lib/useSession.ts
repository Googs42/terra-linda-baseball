import { useEffect, useState } from 'react'

export type SessionUser = {
  id: string | number
  name: string
  username: string
  role: 'coach' | 'viewer' | 'player' | 'parent'
  title?: string | null
  playerLink?: string | null
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tl_session')
      if (raw) setUser(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  return { user, ready }
}
