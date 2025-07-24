import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SpecialRequest {
  id: string;
  guest_name: string;
  room_number: string;
  request_type: string;
  request_details?: string;
  arrival_date: string;
  preparation_status: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: string;
}

export function useSpecialRequests() {
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('special_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setRequests(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  return { requests, loading, error, refetch: () => setLoading(true) };
}