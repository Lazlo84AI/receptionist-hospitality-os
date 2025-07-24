import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  incident_type: string;
  priority: string;
  status: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  location_id?: string;
  affected_departments?: string[];
  related_task_ids?: string[];
  escalation_path?: any;
  // Add these properties for compatibility
  task_type?: string;
  location?: string;
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setIncidents(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchIncidents();
  }, []);

  return { incidents, loading, error, refetch: () => setLoading(true) };
}