import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS } from '@/types'
import type { Client, LeadStage, ProgrammeStage } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ClientListPage() {
  const [leadFilter, setLeadFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')

  const { data: clients } = useQuery({
    queryKey: ['staff-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
      return (data ?? []) as Client[]
    },
  })

  const filtered = clients?.filter((c) => {
    if (leadFilter !== 'all' && c.lead_stage !== leadFilter) return false
    if (stageFilter !== 'all' && c.programme_stage !== stageFilter) return false
    return true
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="mt-1 text-muted-foreground">All {clients?.length ?? 0} clients.</p>
      </div>

      <div className="flex gap-3">
        <Select value={leadFilter} onValueChange={setLeadFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Lead stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lead stages</SelectItem>
            {Object.entries(LEAD_STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Programme stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programme stages</SelectItem>
            {Object.entries(PROGRAMME_STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Lead stage</TableHead>
              <TableHead>Programme stage</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.map((client) => (
              <TableRow key={client.id} className="cursor-pointer">
                <TableCell>
                  <Link to={`/app/staff/clients/${client.id}`} className="font-medium hover:underline">
                    {client.first_name} {client.last_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.email}</TableCell>
                <TableCell>{LEAD_STAGE_LABELS[client.lead_stage as LeadStage] ?? client.lead_stage}</TableCell>
                <TableCell>{client.programme_stage ? (PROGRAMME_STAGE_LABELS[client.programme_stage as ProgrammeStage] ?? client.programme_stage) : '-'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(client.created_at)}</TableCell>
              </TableRow>
            ))}
            {!filtered?.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No clients found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
