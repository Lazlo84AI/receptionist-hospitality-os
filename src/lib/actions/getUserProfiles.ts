import { supabase } from '@/integrations/supabase/client';

export default async function getUserProfiles({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,phone,first_name,last_name,job_title,role,department,is_active,created_at,updated_at')
    .eq('is_active', true)
    .order('department', { ascending: true })
    .order('job_title', { ascending: true })
    .limit(limit);
  
  if (error) throw error;
  
  // Transform data to include full_name for compatibility and display job_title
  const transformedData = (data || []).map(profile => ({
    ...profile,
    full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown User',
    display_role: profile.job_title || profile.role || 'Staff' // Afficher job_title en priorité
  }));
  
  return transformedData;
}