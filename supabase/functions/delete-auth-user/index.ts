import { adminClient } from '../_shared/supabase.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  try {
    const { user_id } = await req.json() as { user_id: string }

    if (!user_id) {
      return json({ error: 'user_id is required' }, 400)
    }

    const db = adminClient()
    const { error } = await db.auth.admin.deleteUser(user_id)

    if (error) {
      console.error('delete-auth-user error:', error)
      return json({ error: error.message }, 500)
    }

    return json({ ok: true })
  } catch (err) {
    console.error('delete-auth-user unexpected error:', err)
    return json({ error: 'Internal error', detail: String(err) }, 500)
  }
})
