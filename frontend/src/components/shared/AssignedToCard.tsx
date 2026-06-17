import type { StaffMember } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AssignedToCard({
  assignedTo, staffMembers, canAssign, eligibleRoles, onAssign,
}: {
  assignedTo: string | null
  staffMembers: StaffMember[]
  canAssign: boolean
  eligibleRoles: StaffMember['role'][]
  onAssign: (staffId: string) => void
}) {
  return (
    <div className="rounded-md border bg-card p-5 space-y-3">
      <h2 className="font-semibold text-sm">Assigned to</h2>
      {canAssign ? (
        <Select value={assignedTo ?? 'none'} onValueChange={v => onAssign(v === 'none' ? '' : v)}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {staffMembers.filter(s => eligibleRoles.includes(s.role) || s.role === 'admin').map(s => (
              <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground">
          {staffMembers.find(s => s.id === assignedTo)?.first_name ?? 'Unassigned'}
        </p>
      )}
    </div>
  )
}
