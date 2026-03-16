"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type TabItem = {
  label: string
  href: string
}

type PageTabsProps = {
  tabs: TabItem[]
  className?: string
}

export function PageTabs({ tabs, className }: PageTabsProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex gap-4 border-b border-[var(--ds-color-semantic-border-default)]",
        className,
      )}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "pb-2 text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] transition-colors",
            pathname === tab.href
              ? "border-b-2 border-ds-brand-500 font-semibold text-ds-heading"
              : "text-ds-muted hover:text-ds-heading",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
