import type React from "react"
import { CalendarDays, Home, QrCode } from "lucide-react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: "Schedule",
      href: "/dashboard/schedule",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      title: "My QR Code",
      href: "/dashboard/qr-code",
      icon: <QrCode className="h-4 w-4" />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl">
              Crach-Scan
            </Link>
            <MainNav items={navItems} />
          </div>
          <UserNav />
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  )
}
