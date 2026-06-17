import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CircleMember, Subscription, SubscriptionStatus } from '@/types'
import { SUBSCRIPTION_STATUS_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SubWithDac extends Subscription {
  dacs: { name: string } | null
}

function subStatusBadge(status: SubscriptionStatus) {
  const label = SUBSCRIPTION_STATUS_LABELS[status] ?? status
  if (['funded', 'active'].includes(status)) {
    return <Badge variant="secondary" className="bg-brand-green-muted text-brand-green">{label}</Badge>
  }
  if (status === 'funds_requested') {
    return <Badge variant="secondary" className="bg-brand-burgundy-muted text-brand-burgundy">{label}</Badge>
  }
  if (status === 'withdrawn') return <Badge variant="destructive">{label}</Badge>
  return <Badge variant="secondary">{label}</Badge>
}

export default function CircleDashboard() {
  const { user } = useAuth()

  const { data: member } = useQuery({
    queryKey: ['my-circle-member'],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_members').select('*').eq('user_id', user!.id).single()
      return data as CircleMember | null
    },
    enabled: !!user,
  })

  const { data: subscriptions } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => {
      if (!member) return []
      const { data } = await supabase
        .from('subscriptions')
        .select('*, dacs(name)')
        .eq('circle_member_id', member.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as SubWithDac[]
    },
    enabled: !!member,
  })

  const { data: openDacCount } = useQuery({
    queryKey: ['open-dac-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('dacs').select('id', { count: 'exact', head: true }).eq('status', 'open')
      return count ?? 0
    },
  })

  const COMMITTED_STATUSES: SubscriptionStatus[] = ['subscribed', 'funds_requested', 'funded', 'active']
  const totalCommitted = (subscriptions ?? [])
    .filter(s => COMMITTED_STATUSES.includes(s.status as SubscriptionStatus))
    .reduce((sum, s) => sum + s.amount, 0)

  const activeCount = (subscriptions ?? []).filter(s => s.status === 'active').length
  const recent = (subscriptions ?? []).slice(0, 3)

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome{member ? `, ${member.first_name}` : ''}</h1>
        <p className="mt-1 text-muted-foreground">Your Homeown Circle investor dashboard.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{formatCurrency(totalCommitted)}</p>
            <p className="mt-1 text-sm font-medium">Total committed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Subscribed through active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{activeCount}</p>
            <p className="mt-1 text-sm font-medium">Active investments</p>
            <p className="text-xs text-muted-foreground mt-0.5">Currently earning coupon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{openDacCount ?? 0}</p>
            <p className="mt-1 text-sm font-medium">Open opportunities</p>
            <p className="text-xs text-muted-foreground mt-0.5">DACs accepting subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent subscriptions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/circle/portfolio">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recent.map((s) => (
                <li key={s.id} className="py-3">
                  <Link to={`/app/circle/portfolio/${s.id}`} className="flex items-center justify-between hover:text-primary">
                    <div>
                      <p className="text-sm font-medium">{s.dacs?.name ?? 'Unknown DAC'}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(s.amount)} &middot; {formatDate(s.created_at)}</p>
                    </div>
                    {subStatusBadge(s.status as SubscriptionStatus)}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:border-primary transition-colors">
          <CardContent className="pt-6">
            <h3 className="font-semibold">View opportunities</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse open and upcoming DACs.</p>
            <Button className="mt-4" asChild><Link to="/app/circle/opportunities">View opportunities</Link></Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary transition-colors">
          <CardContent className="pt-6">
            <h3 className="font-semibold">My portfolio</h3>
            <p className="mt-1 text-sm text-muted-foreground">Track your subscriptions and returns.</p>
            <Button variant="outline" className="mt-4" asChild><Link to="/app/circle/portfolio">View portfolio</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
