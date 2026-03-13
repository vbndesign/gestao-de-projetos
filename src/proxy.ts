import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const internalPrefixes = ['/dashboard', '/projetos', '/clientes']

// @supabase/ssr salva o token como "sb-[project-ref]-auth-token" (pode ser chunked: .0, .1...)
// Verificacao otimista: basta existir qualquer cookie com esse padrao
function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect auth-aware para /
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasSupabaseSession(request) ? '/dashboard' : '/login', request.url)
    )
  }

  // Protecao de rotas internas
  const isInternalRoute = internalPrefixes.some((p) => pathname.startsWith(p))
  if (isInternalRoute) {
    if (!hasSupabaseSession(request)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
