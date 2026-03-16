import { notFound } from 'next/navigation'
import { getProjetoById } from '@/queries/projeto.queries'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { PageTabs } from '@/components/page-tabs'
import { STATUS_LABELS } from '@/lib/constants'

const getProjetoTabs = (id: string) => [
  { label: 'Visão Geral', href: `/projetos/${id}` },
  { label: 'Fases', href: `/projetos/${id}/fases` },
  { label: 'Timeline', href: `/projetos/${id}/timeline` },
  { label: 'Horas', href: `/projetos/${id}/horas` },
]

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
      <PageHeader
        title={projeto.nome}
        breadcrumbs={[
          { label: 'Projetos', href: '/projetos' },
          { label: projeto.nome },
        ]}
        badge={
          <Badge variant="purple">
            {STATUS_LABELS[projeto.status] ?? projeto.status}
          </Badge>
        }
      />

      <PageTabs tabs={getProjetoTabs(id)} />

      {children}
    </div>
  )
}
