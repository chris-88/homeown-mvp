import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Dac, DacStatus } from '@/types'
import { DAC_STATUS_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

interface DacWithSubs extends Dac {
  subscriptions: Array<{ amount: number; status: string }>
}

function dacStatusBadge(status: DacStatus) {
  const label = DAC_STATUS_LABELS[status]
  if (status === 'open') return <Badge className="bg-brand-green-muted text-brand-green hover:bg-brand-green-muted">{label}</Badge>
  if (status === 'upcoming') return <Badge variant="secondary">{label}</Badge>
  if (status === 'draft') return <Badge variant="outline">{label}</Badge>
  return <Badge variant="secondary">{label}</Badge>
}

function raised(subs: Array<{ amount: number; status: string }>) {
  return subs
    .filter(s => !['soft_commit', 'withdrawn'].includes(s.status))
    .reduce((sum, s) => sum + s.amount, 0)
}

export default function DacListPage() {
  const { data: dacs, isLoading } = useQuery({
    queryKey: ['staff-dacs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs')
        .select('*, subscriptions(amount, status)')
        .order('created_at', { ascending: false })
      return (data ?? []) as DacWithSubs[]
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DACs</h1>
          <p className="mt-1 text-muted-foreground">Manage Designated Activity Companies.</p>
        </div>
        <Button asChild>
          <Link to="/app/staff/dacs/new">
            <Plus className="h-4 w-4 mr-2" />Create DAC
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : !dacs?.length ? (
            <p className="text-sm text-muted-foreground py-4">No DACs yet. Create the first one.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Cohort</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Coupon</th>
                  <th className="pb-3 pr-4 font-medium">Target</th>
                  <th className="pb-3 pr-4 font-medium">Raised</th>
                  <th className="pb-3 font-medium">Close date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dacs.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4">
                      <Link to={`/app/staff/dacs/${d.id}`} className="font-medium hover:underline">{d.name}</Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{d.cohort_label ?? '-'}</td>
                    <td className="py-3 pr-4">{dacStatusBadge(d.status as DacStatus)}</td>
                    <td className="py-3 pr-4">{d.coupon_rate ? `${d.coupon_rate}%` : '-'}</td>
                    <td className="py-3 pr-4">{d.target_sub_amount ? `€${d.target_sub_amount.toLocaleString()}` : '-'}</td>
                    <td className="py-3 pr-4">€{raised(d.subscriptions).toLocaleString()}</td>
                    <td className="py-3 text-muted-foreground">{d.close_date ? formatDate(d.close_date) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
