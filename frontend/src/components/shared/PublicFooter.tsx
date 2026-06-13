import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Col 1 */}
          <div>
            <Logo className="h-6 w-auto text-foreground" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A structured property ownership pathway for first-time buyers in Ireland.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <p className="text-sm font-medium">Links</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How it works</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/kfs" className="hover:text-foreground transition-colors">Key Facts Sheet</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy notice</Link></li>
              <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of use</Link></li>
              <li><Link to="/complaints" className="hover:text-foreground transition-colors">Complaints</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <p className="text-sm font-medium">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:hello@homeown.ie" className="hover:text-foreground transition-colors">hello@homeown.ie</a></li>
            </ul>
          </div>
        </div>

        {/* Legal line */}
        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground leading-relaxed">
          Homeown is not a lender, mortgage provider, or residential landlord. The monthly service fee is not rent. The purchase option is a contractual right, not a guaranteed outcome. Mortgage approval at the end of the term is subject to assessment by an independent regulated lender and is not guaranteed by Homeown. The Entry Stake is equity at risk.
        </div>
      </div>
    </footer>
  )
}
