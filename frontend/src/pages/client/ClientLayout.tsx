import { Outlet, Link, useLocation } from 'react-router-dom'
import { RouteGuard } from '@/components/shared/RouteGuard'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Home, Clock, User, LogOut } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

const nav = [
  { to: '/app/client', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
  { to: '/app/client/documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { to: '/app/client/property', label: 'Property', icon: <Home className="h-4 w-4" /> },
  { to: '/app/client/timeline', label: 'Timeline', icon: <Clock className="h-4 w-4" /> },
  { to: '/app/client/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
]

export default function ClientLayout() {
  const { pathname } = useLocation()
  return (
    <RouteGuard requiredRole="client">
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
          <div className="flex h-14 items-center border-b px-6">
            <Link to="/"><Logo className="h-5 w-auto text-foreground" /></Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {nav.map(({ to, label, icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {icon}
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-3">
            <Link
              to="/auth/logout"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </RouteGuard>
  )
}
