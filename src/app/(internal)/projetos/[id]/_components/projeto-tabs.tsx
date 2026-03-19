'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const getTabs = (id: string) => [
  { label: 'Visão Geral', href: `/projetos/${id}` },
  { label: 'Fases', href: `/projetos/${id}/fases` },
  { label: 'Timeline', href: `/projetos/${id}/timeline` },
  { label: 'Horas', href: `/projetos/${id}/horas` },
]

export function ProjetoTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const tabs = getTabs(id)

  return (
    <nav className="flex gap-4 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            pathname === tab.href
              ? 'border-b-2 border-primary pb-2 font-medium'
              : 'pb-2 text-muted-foreground hover:text-foreground'
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
