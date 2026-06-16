import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import type { CircleMember, KycStatus } from '@/types'
import { KYC_STATUS_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

interface MemberWithSubs extends CircleMember {
  subscriptions: Array<{ amount: number; status: string }>
}

function kycBadge(status: KycStatus) {
  if (status === 'complete') return <Badge variant="secondary" className="bg-green-100 text-green-800">{KYC_STATUS_LABELS[status]}</Badge>
  if (status === 'failed') return <Badge variant="destructive">{KYC_STATUS_LABELS[status]}</Badge>
  if (status === 'in_progress') return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{KYC_STATUS_LABELS[status]}</Badge>
  return <Badge variant="secondary">{KYC_STATUS_LABELS[status]}</Badge>
}

function totalInvested(subs: Array<{ amount: number; status: string }>) {
  return subs
    .filter(s => ['funded', 'active'].includes(s.status))
    .reduce((sum, s) => sum + s.amount, 0)
}

export default function CircleListPage() {
  const [searchParams] = useSearchParams()
  const [kycFilter, setKycFilter] = useState<string>(searchParams.get('kyc') ?? 'all')

  const { data: members, isLoading } = useQuery({
    queryKey: ['staff-circle-members'],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_members')
        .select('*, subscriptions(amount, status)')
        .order('created_at', { ascending: false })
      return (data ?? []) as MemberWithSubs[]
    },
  })

  const filtered = (members ?? []).filter(m =>
    kycFilter === 'all' || m.kyc_status === kycFilter
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Circle CRM</h1>
          <p className="mt-1 text-muted-foreground">Manage Circle investor members.</p>
        </div>
        <Button asChild>
          <Link to="/app/staff/circle/new">
            <UserPlus className="h-4 w-4 mr-2" />Add member
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">KYC status</label>
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.entries(KYC_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : !filtered.length ? (
            <p className="text-sm text-muted-foreground py-4">No members found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">KYC</th>
                  <th className="pb-3 pr-4 font-medium">Total invested</th>
                  <th className="pb-3 pr-4 font-medium">Subscriptions</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-4">
                      <Link to={`/app/staff/circle/${m.id}`} className="font-medium hover:underline">
                        {m.first_name} {m.last_name}
                      </Link>
                      {!m.active && <span className="ml-2 text-xs text-muted-foreground">(disabled)</span>}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{m.email}</td>
                    <td className="py-3 pr-4">{kycBadge(m.kyc_status as KycStatus)}</td>
                    <td className="py-3 pr-4">
                      {totalInvested(m.subscriptions) > 0
                        ? `€${totalInvested(m.subscriptions).toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="py-3 pr-4">{m.subscriptions.length}</td>
                    <td className="py-3 text-muted-foreground">
                      {m.user_id ? formatDate(m.created_at) : <span className="text-amber-600">Pending</span>}
                    </td>
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
