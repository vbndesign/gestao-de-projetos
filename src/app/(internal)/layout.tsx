import { requireAuth } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <SessionProvider user={user}>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
