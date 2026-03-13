'use client'

import { Button } from '@/components/ui/button'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export function LoginButton() {
  async function handleLogin() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Button onClick={handleLogin} size="lg">
      Entrar com Google
    </Button>
  )
}
