import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is a logged-in principal
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Check caller's role using their JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('role')
      .single()

    if (profileError || callerProfile?.role !== 'principal') {
      return new Response(JSON.stringify({ error: 'Only principals can create users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { email, name, role, company } = await req.json()
    if (!email || !name || !role) throw new Error('email, name and role are required')

    const validRoles = ['principal', 'architect', 'intern', 'manager', 'client']
    if (!validRoles.includes(role)) throw new Error('Invalid role')

    // Create the auth user with admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: crypto.randomUUID(), // random temp password — user will reset via email
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (createError) throw createError

    // Update profile role (trigger already created it as 'pending')
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role, name, avatar_initials: name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase(), company: company || null })
      .eq('id', newUser.user.id)

    if (updateError) throw updateError

    // Send password reset email so user can set their own password
    await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${req.headers.get('origin') || supabaseUrl}/reset-password` },
    })

    return new Response(
      JSON.stringify({ success: true, user: { id: newUser.user.id, email, name, role } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
