// supabase/functions/delete-staff/index.ts
//
// Edge Function : delete-staff
// ----------------------------
// Supprime un membre du staff de maniere propre, en cascade sur auth.users + profiles
// + staff_directory. Remplace l'ancien `supabase.from('staff_directory').delete()` cote
// front qui laissait auth.users + profiles orphelins (login encore possible).
//
// Securite :
//   - verify_jwt = true (defaut Supabase) : seul un user authentifie peut appeler
//   - Re-check serveur du role : l'appelant doit avoir hierarchy='Manager' OU service='direction'
//     (le gate UI front n'est pas une garantie suffisante pour une operation destructive)
//
// Body attendu (au moins un des deux IDs requis) :
//   {
//     auth_user_id?: string,        // si la personne a un compte Sokle
//     staff_directory_id?: string,  // si la personne a une ligne staff_directory
//   }
//
// Branches gerees :
//   A. auth_user_id + staff_directory_id  -> cas standard (membre lie)
//   B. auth_user_id seul                  -> profile orphelin sans sd (ex: Shami)
//   C. staff_directory_id seul            -> sd sans auth (ex: Remy)
//
// Ordre des operations (important) :
//   1. auth.admin.deleteUser(auth_user_id)
//      -> cascade automatique vers profiles via FK profiles.id -> auth.users.id (ON DELETE CASCADE)
//   2. DELETE staff_directory
//      -> la FK profiles.staff_directory_id etant en NO ACTION, on doit avoir supprime
//        profiles AVANT, sinon blocage.
//
// Gestion FK violation :
//   - 11 tables (shifts, incidents, comments, checklists, reminders, attachments,
//     escalations x2, task_members x2, profiles) ont une FK vers staff_directory.id en NO ACTION.
//   - Si une donnee liee existe -> Postgres retourne code 23503.
//   - On catch et on remonte { code: 'FK_VIOLATION' } -> le front affichera un toast clair.
//
// Audit :
//   - Log dans system_events avec event_type='staff_deleted' (succes) ou 'staff_deleted_partial'
//     (cas ou auth a ete supprime mais sd a plante en FK).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // -- 1. Parse body ------------------------------------------------------
    const { auth_user_id, staff_directory_id } = await req.json()

    if (!auth_user_id && !staff_directory_id) {
      return json(
        { error: 'Au moins un des deux IDs est requis : auth_user_id ou staff_directory_id.' },
        400
      )
    }

    // -- 2. Identification de l'appelant via son JWT ------------------------
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Header Authorization manquant ou invalide.' }, 401)
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !userData?.user) {
      return json({ error: 'Authentification echouee.' }, 401)
    }
    const callerId = userData.user.id

    // -- 3. Verification du role de l'appelant (re-check serveur) -----------
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('hierarchy, service')
      .eq('id', callerId)
      .maybeSingle()

    if (profileErr) {
      return json({ error: `Erreur lecture profile appelant : ${profileErr.message}` }, 500)
    }
    if (!callerProfile) {
      return json({ error: 'Profil appelant introuvable.' }, 403)
    }

    const isManager   = callerProfile.hierarchy === 'Manager'
    const isDirection = callerProfile.service   === 'direction'
    if (!isManager && !isDirection) {
      return json({ error: 'Action reservee aux Managers et a la Direction.' }, 403)
    }

    // -- 4. Suppression auth.users (si auth_user_id fourni) -----------------
    // Cascade automatique vers profiles via FK ON DELETE CASCADE
    let authDeleted = false
    if (auth_user_id) {
      const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(auth_user_id)
      if (delAuthErr) {
        return json({ error: `Suppression auth.users echouee : ${delAuthErr.message}` }, 500)
      }
      authDeleted = true
    }

    // -- 5. Suppression staff_directory (si staff_directory_id fourni) ------
    let sdDeleted = false
    if (staff_directory_id) {
      const { error: delSdErr } = await supabaseAdmin
        .from('staff_directory')
        .delete()
        .eq('id', staff_directory_id)

      if (delSdErr) {
        const isFkViolation =
          (delSdErr as any).code === '23503' || /foreign key/i.test(delSdErr.message)

        if (isFkViolation) {
          // Audit partiel : auth est peut-etre deja supprime, on doit le tracer
          await supabaseAdmin.from('system_events').insert({
            event_type: 'staff_deleted_partial',
            payload: {
              auth_user_id: auth_user_id ?? null,
              staff_directory_id,
              auth_deleted: authDeleted,
              sd_deleted: false,
              fk_error: delSdErr.message,
            },
            created_by: callerId,
          })

          return json(
            {
              error:
                'Ce membre est lie a des donnees (shifts, taches, incidents...). ' +
                'Desactivez-le plutot via is_active=false.',
              code: 'FK_VIOLATION',
              partial: { auth_deleted: authDeleted },
            },
            409
          )
        }

        return json({ error: `Suppression staff_directory echouee : ${delSdErr.message}` }, 500)
      }
      sdDeleted = true
    }

    // -- 6. Audit succes ----------------------------------------------------
    await supabaseAdmin.from('system_events').insert({
      event_type: 'staff_deleted',
      payload: {
        auth_user_id: auth_user_id ?? null,
        staff_directory_id: staff_directory_id ?? null,
        auth_deleted: authDeleted,
        sd_deleted: sdDeleted,
      },
      created_by: callerId,
    })

    return json({ success: true, auth_deleted: authDeleted, sd_deleted: sdDeleted })
  } catch (err: any) {
    console.error('delete-staff error:', err)
    return json({ error: err?.message ?? 'Internal error' }, 500)
  }
})
