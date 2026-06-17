import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Dac, CircleMember, DacStatus } from '@/types'
import { DAC_STATUS_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

function dacStatusBadge(status: DacStatus) {
  const label = DAC_STATUS_LABELS[status]
  if (status === 'open') return <Badge className="bg-brand-green-muted text-brand-green hover:bg-brand-green-muted">{label}</Badge>
  if (status === 'upcoming') return <Badge variant="secondary">{label}</Badge>
  return <Badge variant="outline">{label}</Badge>
}

function DacCard({ dac, totalSubscribed }: { dac: Dac; totalSubscribed: number }) {
  const target = dac.target_sub_amount ?? 0
  const remaining = Math.max(0, target - totalSubscribed)
  const pct = target > 0 ? Math.min(100, Math.round((totalSubscribed / target) * 100)) : 0
  const isFull = target > 0 && remaining === 0

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">{dac.name}</h3>
            {dac.cohort_label && <p className="text-sm text-muted-foreground">{dac.cohort_label}</p>}
          </div>
          {dacStatusBadge(dac.status as DacStatus)}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {dac.geographic_focus && (
            <div><span className="text-muted-foreground">Geography: </span>{dac.geographic_focus}</div>
          )}
          {dac.property_count && (
            <div><span className="text-muted-foreground">Properties: </span>{dac.property_count}</div>
          )}
          {dac.coupon_rate && (
            <div><span className="text-muted-foreground">Coupon rate: </span><strong>{dac.coupon_rate}% p.a.</strong></div>
          )}
          {dac.close_date && (
            <div><span className="text-muted-foreground">Closes: </span>{formatDate(dac.close_date)}</div>
          )}
        </div>

        {target > 0 && (
          <div className="space-y-2">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subscribed: {formatCurrency(totalSubscribed)}</span>
              <span>Target: {formatCurrency(target)}</span>
            </div>
            <p className={cn(
              'text-sm font-medium',
              isFull ? 'text-muted-foreground' : 'text-brand-green'
            )}>
              {isFull ? 'Fully subscribed' : `${formatCurrency(remaining)} available`}
            </p>
          </div>
        )}

        <Button asChild>
          <Link to={`/app/circle/opportunities/${dac.id}`}>View details</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function OpportunitiesPage() {
  const { user } = useAuth()

  const { data: member } = useQuery({
    queryKey: ['my-circle-member'],
    queryFn: async () => {
      const { data } = await supabase.from('circle_members').select('*').eq('user_id', user!.id).single()
      return data as CircleMember | null
    },
    enabled: !!user,
  })

  const { data: activeDacs, isLoading } = useQuery({
    queryKey: ['dacs-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs')
        .select('*')
        .in('status', ['upcoming', 'open'])
        .order('open_date', { ascending: true })
      return (data ?? []) as Dac[]
    },
  })

  const { data: closedDacs } = useQuery({
    queryKey: ['dacs-closed'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs')
        .select('*')
        .in('status', ['closed', 'matured'])
        .order('close_date', { ascending: false })
      return (data ?? []) as Dac[]
    },
  })

  // Aggregate totals across all members via SECURITY DEFINER function
  const { data: subTotals } = useQuery({
    queryKey: ['dac-sub-totals'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_dac_sub_totals')
      return (data ?? []) as Array<{ dac_id: string; total_subscribed: number }>
    },
  })

  const totalsByDac: Record<string, number> = Object.fromEntries(
    (subTotals ?? []).map(r => [r.dac_id, r.total_subscribed])
  )

  if (!member) return null

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <p className="mt-1 text-muted-foreground">Open and upcoming DAC investment opportunities.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !activeDacs?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No open opportunities at the moment. Check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeDacs.map((dac) => (
            <DacCard key={dac.id} dac={dac} totalSubscribed={totalsByDac[dac.id] ?? 0} />
          ))}
        </div>
      )}

      {(closedDacs?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Historical</h2>
          <div className="grid gap-4">
            {closedDacs!.map((dac) => (
              <DacCard key={dac.id} dac={dac} totalSubscribed={totalsByDac[dac.id] ?? 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
