'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

const SessionContext = createContext<User | null>(null)

export function SessionProvider({
  children,
  user,
}: {
  children: React.ReactNode
  user: User
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const user = useContext(SessionContext)
  if (!user) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return user
}
