import { notFound } from 'next/navigation'
import { LayoutDashboard, Layers, BarChart2, Clock } from 'lucide-react'
import { getProjetoById } from '@/queries/projeto.queries'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { PageTabs } from '@/components/page-tabs'
import { STATUS_LABELS } from '@/lib/constants'

const getProjetoTabs = (id: string) => [
  { label: 'Visão Geral', href: `/projetos/${id}`, icon: <LayoutDashboard size={16} /> },
  { label: 'Fases', href: `/projetos/${id}/fases`, icon: <Layers size={16} /> },
  { label: 'Timeline', href: `/projetos/${id}/timeline`, icon: <BarChart2 size={16} /> },
  { label: 'Horas', href: `/projetos/${id}/horas`, icon: <Clock size={16} /> },
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
        subtitle={projeto.cliente.nome}
        breadcrumbs={[{ label: 'Projetos', href: '/projetos' }]}
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
