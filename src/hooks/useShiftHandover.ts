// Hook pour récupérer les cartes au début de shift avec règles intelligentes
import { useState, useEffect } from 'react';
import { getShiftHandover, completeHandover } from '@/lib/shiftContinuityManager';

export interface ShiftHandoverData {
  handoverId: string;
  tasks: any[]; // Cartes filtrées selon les règles
  voiceNote: {
    url: string | null;
    transcription: string | null;
  };
  notes: string | null;
  stats: {
    totalArchived: number;
    transferred: number;
    archived: number;
  };
}

export const useShiftHandover = (currentUserId: string) => {
  const [data, setData] = useState<ShiftHandoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserId) {
      fetchHandover();
    }
  }, [currentUserId]);

  const fetchHandover = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Récupération du handover pour:', currentUserId);
      const handoverData = await getShiftHandover(currentUserId);
      
      if (handoverData.tasks.length === 0) {
        console.log('📭 Aucune carte à transférer');
        setData(null);
      } else {
        console.log(`📋 ${handoverData.tasks.length} cartes récupérées pour ce shift`);
        setData(handoverData);
      }
      
    } catch (err: any) {
      console.error('Erreur récupération handover:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptHandover = async (newShiftId: string) => {
    if (!data) return;
    
    try {
      await completeHandover(data.handoverId, newShiftId);
      console.log('✅ Handover accepté et finalisé');
      // Optionnel: recharger pour s'assurer que c'est bien traité
      setData(null);
    } catch (err: any) {
      console.error('Erreur finalisation handover:', err);
      throw err;
    }
  };

  return { 
    data, 
    loading, 
    error, 
    acceptHandover,
    refetch: fetchHandover 
  };
};