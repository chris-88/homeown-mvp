import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { cn } from '@/lib/utils'
import { LayoutDashboard, TrendingUp, PieChart, FileText, User, LogOut } from 'lucide-react'

const nav = [
  { to: '/app/circle', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
  { to: '/app/circle/opportunities', label: 'Opportunities', icon: <TrendingUp className="h-4 w-4" /> },
  { to: '/app/circle/portfolio', label: 'My Portfolio', icon: <PieChart className="h-4 w-4" /> },
  { to: '/app/circle/documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { to: '/app/circle/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
]

export default function CircleLayout() {
  const { pathname } = useLocation()
  return (
    <RouteGuard requiredRole="circle">
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
          <div className="flex h-14 items-center border-b px-6">
            <Link to="/" className="text-sm font-semibold tracking-tight">Homeown Circle</Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map(({ to, label, icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to)
              return (
                <Link key={to} to={to} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors', active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                  {icon}{label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-3">
            <Link to="/auth/logout" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <LogOut className="h-4 w-4" />Sign out
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </RouteGuard>
  )
}
