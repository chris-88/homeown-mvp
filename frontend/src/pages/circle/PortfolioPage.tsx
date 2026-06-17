import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CircleMember, Subscription, SubscriptionStatus } from '@/types'
import { SUBSCRIPTION_STATUS_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SubWithDac extends Subscription {
  dacs: { name: string; coupon_rate: number | null; term_months: number } | null
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

export default function PortfolioPage() {
  const { user } = useAuth()

  const { data: member } = useQuery({
    queryKey: ['my-circle-member'],
    queryFn: async () => {
      const { data } = await supabase.from('circle_members').select('*').eq('user_id', user!.id).single()
      return data as CircleMember | null
    },
    enabled: !!user,
  })

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => {
      if (!member) return []
      const { data } = await supabase
        .from('subscriptions')
        .select('*, dacs(name, coupon_rate, term_months)')
        .eq('circle_member_id', member.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as SubWithDac[]
    },
    enabled: !!member,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <p className="mt-1 text-muted-foreground">Your DAC subscriptions and investment status.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !subscriptions?.length ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">No subscriptions yet.</p>
            <Link to="/app/circle/opportunities" className="text-sm underline">Browse opportunities</Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Subscriptions</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">DAC</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Rate</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Committed</th>
                  <th className="pb-3 font-medium">Maturity</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 cursor-pointer">
                    <td className="py-3 pr-4">
                      <Link to={`/app/circle/portfolio/${s.id}`} className="font-medium hover:underline">
                        {s.dacs?.name ?? '-'}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{formatCurrency(s.amount)}</td>
                    <td className="py-3 pr-4">
                      {s.coupon_rate_locked ? `${s.coupon_rate_locked}%` : '-'}
                    </td>
                    <td className="py-3 pr-4">{subStatusBadge(s.status as SubscriptionStatus)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {s.committed_at ? formatDate(s.committed_at) : '-'}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {s.maturity_date ? formatDate(s.maturity_date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
