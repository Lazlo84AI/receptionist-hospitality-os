import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Shift {
  id: string;
  receptionist_id: string;
  shift_type: string;
  start_time: string;
  end_time?: string;
  status: string;
  handover_notes?: string;
  voice_handover_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftHandover {
  id: string;
  from_shift_id: string;
  to_shift_id?: string;
  handover_data: any;
  additional_notes?: string;
  voice_notes_url?: string;
  created_at: string;
}

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { shifts, loading, error, refetch: fetchShifts };
}

export function useActiveShift(receptionistId?: string) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receptionistId) return;
    
    fetchActiveShift();
  }, [receptionistId]);

  const fetchActiveShift = async () => {
    if (!receptionistId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('receptionist_id', receptionistId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveShift(data || null);
    } catch (err) {
      console.error('Error fetching active shift:', err);
      setActiveShift(null);
    } finally {
      setLoading(false);
    }
  };

  return { activeShift, loading, refetch: fetchActiveShift };
}

export function useShiftHandovers() {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shift_handovers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHandovers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { handovers, loading, error, refetch: fetchHandovers };
}

export function useLatestHandover() {
  const [latestHandover, setLatestHandover] = useState<ShiftHandover | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestHandover();
  }, []);

  const fetchLatestHandover = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shift_handovers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setLatestHandover(data || null);
    } catch (err) {
      console.error('Error fetching latest handover:', err);
      setLatestHandover(null);
    } finally {
      setLoading(false);
    }
  };

  return { latestHandover, loading, refetch: fetchLatestHandover };
}