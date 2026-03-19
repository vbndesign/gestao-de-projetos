'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  LogOut,
  PieChart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type MenuItemProps = {
  href: string
  label: string
  icon: React.ElementType
  isActive: boolean
}

function MenuItem({ href, label, icon: Icon, isActive }: MenuItemProps) {
  return (
    <Link
      href={href}
      className={`flex h-14 shrink-0 items-center gap-4 rounded-md px-4 text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] transition-colors ${
        isActive
          ? 'bg-ds-brand-500 text-white'
          : 'bg-ds-surface text-ds-muted hover:bg-ds-subtle'
      }`}
    >
      <Icon size={24} className="shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-14 w-full items-center gap-4 px-4 text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-[#CC5F5F]"
    >
      <LogOut size={24} className="shrink-0" />
      <span>Logout</span>
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      href: '/clientes',
      label: 'Clientes',
      icon: Users,
      isActive: pathname === '/clientes',
    },
    {
      href: '/projetos',
      label: 'Projetos',
      icon: FolderOpen,
      isActive: pathname.startsWith('/projetos'),
    },
  ]

  return (
    <aside className="flex w-80 shrink-0 flex-col justify-between bg-ds-surface px-6 py-8">
      {/* top: logo + nav */}
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-2">
          <PieChart size={56} className="shrink-0 text-ds-heading" />
          <span className="text-[length:var(--ds-typography-size-h5)] font-semibold leading-[var(--ds-typography-line-height-h5)] text-ds-heading">
            Projetos
          </span>
        </div>
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => (
            <MenuItem key={item.href} {...item} />
          ))}
        </nav>
      </div>

      {/* bottom: settings + logout */}
      <div className="flex flex-col gap-4">
        <MenuItem
          href="/settings"
          label="Settings"
          icon={Settings}
          isActive={pathname === '/settings'}
        />
        <LogoutButton />
      </div>
    </aside>
  )
}
