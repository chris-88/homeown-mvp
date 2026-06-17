import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Event } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function NotesTab({
  clientId, events, onAdded,
}: { clientId: string; events: Event[]; onAdded: () => void }) {
  const { user } = useAuth()
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  const notes = events.filter(e => e.event_type === 'staff_note')

  async function handleAddNote() {
    if (!noteText.trim()) return
    setNoteLoading(true)
    await supabase.from('events').insert({
      client_id: clientId, event_type: 'staff_note', actor_id: user?.id ?? null,
      payload: { text: noteText.trim() }, visibility: 'internal',
    })
    setNoteText('')
    setNoteLoading(false)
    onAdded()
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border bg-card p-5 space-y-3">
        <Textarea
          placeholder="Add an internal note…"
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          rows={3}
        />
        <Button size="sm" onClick={handleAddNote} disabled={noteLoading || !noteText.trim()}>
          {noteLoading ? 'Saving…' : 'Add note'}
        </Button>
      </section>

      <section className="rounded-md border bg-card p-5 space-y-3">
        {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        <div className="space-y-3">
          {notes.map(ev => (
            <div key={ev.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
              <div>
                <p className="font-medium">{(ev.payload as { text: string })?.text}</p>
                <p className="text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
