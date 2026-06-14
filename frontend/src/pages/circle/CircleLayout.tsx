import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { cn } from '@/lib/utils'
import { LayoutDashboard, TrendingUp, PieChart, FileText, User, LogOut } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

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
      <div className="portal-context flex min-h-screen bg-background">
        <aside className="hidden w-60 shrink-0 md:flex md:flex-col bg-brand-burgundy text-brand-cream">
          <div className="flex h-14 items-center border-b border-white/10 px-6">
            <Link to="/" className="flex flex-col gap-0.5">
              <Logo className="h-5 w-auto text-brand-cream" />
              <span className="text-[10px] font-medium tracking-widest text-brand-cream/60 uppercase">Circle</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map(({ to, label, icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to)
              return (
                <Link key={to} to={to} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors', active ? 'bg-white/15 text-brand-cream font-medium' : 'text-brand-cream/70 hover:bg-white/10 hover:text-brand-cream')}>
                  {icon}{label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <Link to="/auth/logout" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-cream/70 transition-colors hover:bg-white/10 hover:text-brand-cream">
              <LogOut className="h-4 w-4" />Sign out
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </RouteGuard>
  )
}
