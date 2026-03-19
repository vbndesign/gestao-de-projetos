"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type TabItem = {
  label: string
  href: string
  icon?: React.ReactNode
}

type PageTabsProps = {
  tabs: TabItem[]
  className?: string
}

export function PageTabs({ tabs, className }: PageTabsProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex gap-2", className)}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            buttonVariants({
              variant: pathname === tab.href ? "filled-brand" : "outline-brand",
            }),
            "h-14 rounded-[4px] gap-2",
          )}
        >
          {tab.icon}
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
