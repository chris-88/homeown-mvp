import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { CircleMember, CircleMemberDocument } from '@/types'
import { CIRCLE_MEMBER_DOC_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

export default function CircleDocuments() {
  const { user } = useAuth()

  const { data: member } = useQuery({
    queryKey: ['my-circle-member'],
    queryFn: async () => {
      const { data } = await supabase.from('circle_members').select('*').eq('user_id', user!.id).single()
      return data as CircleMember | null
    },
    enabled: !!user,
  })

  const { data: documents, isLoading } = useQuery({
    queryKey: ['my-circle-documents', member?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_member_documents')
        .select('*')
        .eq('circle_member_id', member!.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as CircleMemberDocument[]
    },
    enabled: !!member,
  })

  async function openSignedUrl(filePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1 text-muted-foreground">Documents shared with you by the Homeown team.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">My documents</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : !documents?.length ? (
            <p className="text-muted-foreground text-sm py-4">No documents yet.</p>
          ) : (
            <ul className="divide-y">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CIRCLE_MEMBER_DOC_TYPE_LABELS[doc.doc_type as keyof typeof CIRCLE_MEMBER_DOC_TYPE_LABELS] ?? doc.doc_type}
                      {' '}&middot;{' '}{formatDate(doc.created_at)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openSignedUrl(doc.file_path)}>
                    <Download className="h-3.5 w-3.5 mr-1" />Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
