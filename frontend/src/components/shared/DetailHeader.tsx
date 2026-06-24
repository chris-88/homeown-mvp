import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Ban, RotateCcw, Trash2 } from 'lucide-react'

export function DetailHeader({
  backTo, backLabel, name, subtitle, active, statusBadge,
  isAdmin, disableLoading, onToggleActive, onDelete, hideAdminButtons,
}: {
  backTo: string
  backLabel: string
  name: string
  subtitle?: string
  active: boolean
  statusBadge?: React.ReactNode
  isAdmin: boolean
  disableLoading: boolean
  onToggleActive: () => void
  onDelete: () => void
  hideAdminButtons?: boolean
}) {
  return (
    <>
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />{backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!active && <Badge variant="outline" className="text-sm px-3 py-1 text-muted-foreground">Disabled</Badge>}
          {statusBadge}
          {isAdmin && !hideAdminButtons && (
            <>
              <Button variant="outline" size="sm" onClick={onToggleActive} disabled={disableLoading}>
                {active
                  ? <><Ban className="h-3.5 w-3.5 mr-1.5" />Disable</>
                  : <><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Enable</>}
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}
                className="text-destructive border-destructive/40 hover:bg-destructive/5">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
