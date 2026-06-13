import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'

const NAV_LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/faq', label: 'FAQ' },
]

export function PublicNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center">
          <Logo className="h-7 w-auto text-foreground" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn('text-sm transition-colors hover:text-foreground', pathname === to ? 'font-medium text-foreground' : 'text-muted-foreground')}
            >
              {label}
            </Link>
          ))}
          <Link to="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
          <Button asChild size="sm">
            <Link to="/calc">Check your numbers →</Link>
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex items-center md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background px-6 pb-6 md:hidden">
          <nav className="mt-4 flex flex-col gap-4">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn('text-sm', pathname === to ? 'font-medium text-foreground' : 'text-muted-foreground')}
              >
                {label}
              </Link>
            ))}
            <Link to="/auth/login" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Sign in</Link>
            <Button asChild size="sm" className="w-full">
              <Link to="/calc" onClick={() => setOpen(false)}>Check your numbers</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
