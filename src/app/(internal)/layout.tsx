import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/sidebar'
import { ShellSkeleton } from '@/components/shell-skeleton'

async function AuthenticatedContent({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  return <SessionProvider user={user}>{children}</SessionProvider>
}

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-ds-canvas">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-y-auto p-ds-32">
        <Suspense fallback={<ShellSkeleton />}>
          <AuthenticatedContent>{children}</AuthenticatedContent>
        </Suspense>
      </main>
      <Toaster />
    </div>
  )
}
