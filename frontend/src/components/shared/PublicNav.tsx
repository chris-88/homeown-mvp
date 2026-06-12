import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const links = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/faq', label: 'FAQ' },
  { to: '/calc', label: 'Calculator' },
]

export function PublicNav() {
  const { pathname } = useLocation()
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">Homeown</Link>
        <nav className="flex items-center gap-6">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn('text-sm transition-colors hover:text-foreground', pathname === to ? 'text-foreground font-medium' : 'text-muted-foreground')}
            >
              {label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link to="/auth/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
