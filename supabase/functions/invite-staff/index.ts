// supabase/functions/invite-staff/index.ts
//
// Edge Function : invite-staff
// ----------------------------
// Envoie un email d'invitation Supabase a un nouveau membre du staff.
// Le trigger PostgreSQL handle_new_user creera ensuite profiles + staff_directory
// en cascade quand le user clique sur le lien et definit son mdp.
//
// Securite :
//   - verify_jwt = true (defaut Supabase) : seul un user authentifie peut appeler
//   - Pas de check role/service : le bouton est gate cote front (AdminProtectedRoute)
//   - redirectTo limite par Supabase a la whitelist Auth > URL Configuration
//
// Body attendu :
//   {
//     firstName: string,
//     lastName: string,
//     email: string,
//     jobRole: string,    // une des 7 valeurs du dropdown signup
//     hierarchy: string,  // "Collaborator" ou "Manager"
//     appOrigin: string   // window.location.origin envoye par le front
//   }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { firstName, lastName, email, jobRole, hierarchy, appOrigin } = await req.json()

    // Validation minimale du payload
    if (!firstName || !lastName || !email || !jobRole || !hierarchy || !appOrigin) {
      return new Response(
        JSON.stringify({ error: 'Champs manquants : firstName, lastName, email, jobRole, hierarchy, appOrigin requis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client Supabase avec service_role pour appeler auth.admin.*
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Envoi de l'invitation
    // Le trigger handle_new_user lira raw_user_meta_data pour creer profiles + staff_directory
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        job_role: jobRole,
        hierarchy: hierarchy,
      },
      redirectTo: `${appOrigin}/reset-password`,
    })

    if (error) {
      console.error('inviteUserByEmail error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user: data.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
