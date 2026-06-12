import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'homeown_cookie_notice_dismissed'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background px-6 py-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          This site uses essential cookies to keep you logged in to the portal. We do not use tracking or analytics cookies.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/cookies" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Cookie policy
          </Link>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
