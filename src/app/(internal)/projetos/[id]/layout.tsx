import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjetoById } from '@/queries/projeto.queries'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/constants'
import { ProjetoTabs } from './_components/projeto-tabs'

export default async function ProjetoLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = await params
  const projeto = await getProjetoById(id)

  if (!projeto) notFound()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projetos" className="hover:text-foreground">
          Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground">{projeto.nome}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{projeto.nome}</h1>
        <Badge variant="secondary">
          {STATUS_LABELS[projeto.status] ?? projeto.status}
        </Badge>
      </div>

      {/* Tabs */}
      <ProjetoTabs id={id} />

      {/* Content */}
      {children}
    </div>
  )
}
