import { requireAuth } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/sidebar'

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <SessionProvider user={user}>
      <div className="flex h-screen bg-ds-canvas">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto p-ds-32">
          {children}
        </main>
      </div>
      <Toaster />
    </SessionProvider>
  )
}
