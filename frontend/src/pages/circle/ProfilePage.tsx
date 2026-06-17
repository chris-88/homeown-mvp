import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CircleMember, KycStatus } from '@/types'
import { KYC_STATUS_LABELS } from '@/types'

function kycBadge(status: KycStatus) {
  if (status === 'complete') return <Badge variant="secondary" className="bg-brand-green-muted text-brand-green">{KYC_STATUS_LABELS[status]}</Badge>
  if (status === 'failed') return <Badge variant="destructive">{KYC_STATUS_LABELS[status]}</Badge>
  if (status === 'in_progress') return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{KYC_STATUS_LABELS[status]}</Badge>
  return <Badge variant="secondary">{KYC_STATUS_LABELS[status]}</Badge>
}

export default function CircleProfile() {
  const { user } = useAuth()

  const { data: member, isLoading } = useQuery({
    queryKey: ['my-circle-member'],
    queryFn: async () => {
      const { data } = await supabase.from('circle_members').select('*').eq('user_id', user!.id).single()
      return data as CircleMember | null
    },
    enabled: !!user,
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!member) return <div className="p-8 text-muted-foreground">Profile not found.</div>

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Personal details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{member.first_name} {member.last_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p>{member.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{member.phone ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">KYC status</p>
              {kycBadge(member.kyc_status as KycStatus)}
            </div>
          </div>
          {member.address && (
            <div>
              <p className="text-muted-foreground">Address</p>
              <p>{member.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        To update your details, please contact your Homeown relationship manager.
      </p>
    </div>
  )
}
