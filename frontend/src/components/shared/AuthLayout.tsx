import { Link } from 'react-router-dom'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-stone flex items-center justify-center p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg shadow-xl flex">

        {/* Left — form panel */}
        <div className="flex-1 bg-card px-8 py-10 flex flex-col justify-between">
          <div>
            <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              ← Back to site
            </Link>
          </div>
          <div className="my-auto pt-6">
            {children}
          </div>
          <p className="pt-8 text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Notice</Link>.
          </p>
        </div>

        {/* Right — brand panel (hidden on small screens) */}
        <div className="hidden lg:flex w-[420px] shrink-0 items-center justify-center bg-brand-green">
          <img
            src="/main-logo.png"
            alt="Homeown"
            className="w-64 select-none"
            draggable={false}
          />
        </div>

      </div>
    </div>
  )
}
