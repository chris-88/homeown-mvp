import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { STAFF_ROLE_LABELS } from '@/types'
import type { StaffMember } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, UserPlus } from 'lucide-react'

export default function TeamListPage() {
  const { staffMember: me } = useAuth()

  const { data: members, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff-members-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_members').select('*').order('first_name')
      if (error) throw error
      return (data ?? []) as StaffMember[]
    },
  })

  if (me?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Building2 className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p>Team management is restricted to admins.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="mt-1 text-muted-foreground">Manage staff accounts and roles.</p>
        </div>
        <Button asChild>
          <Link to="/app/staff/team/new"><UserPlus className="mr-2 h-4 w-4" />Add member</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(members ?? []).map(m => (
                  <tr key={m.id}>
                    <td className="py-3 pr-4">
                      <Link to={`/app/staff/team/${m.id}`} className="font-medium hover:underline underline-offset-2">
                        {m.first_name} {m.last_name}
                      </Link>
                      {m.job_title && <p className="text-xs text-muted-foreground">{m.job_title}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline">{STAFF_ROLE_LABELS[m.role]}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{m.email}</td>
                    <td className="py-3 pr-4">
                      {m.user_id ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {m.user_id ? new Date(m.created_at).toLocaleDateString('en-IE') : 'Not yet joined'}
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
