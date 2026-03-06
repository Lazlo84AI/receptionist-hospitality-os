import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Vérifier si l'onboarding a déjà été affiché cette session
      const sessionKey = `onboarding_shown_${user.id}`;
      const alreadyShownThisSession = sessionStorage.getItem(sessionKey);
      
      if (alreadyShownThisSession === 'true') {
        setIsLoading(false);
        setShouldShowOnboarding(false);
        return;
      }

      try {
        // Récupérer le compteur de vues depuis staff_directory via auth_user_id
        const { data: staff, error } = await supabase
          .from('staff_directory')
          .select('onboarding_views_count')
          .eq('auth_user_id', user.id)
          .single();

        if (error) throw error;

        const viewCount = staff?.onboarding_views_count || 0;

        // Afficher si <= 10 vues ET pas déjà affiché cette session
        if (viewCount <= 10) {
          setShouldShowOnboarding(true);
          // Marquer comme affiché pour cette session
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id]);

  const incrementOnboardingViews = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('increment_onboarding_views', {
        user_uuid: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing onboarding views:', error);
    }
  };

  const closeOnboarding = async () => {
    await incrementOnboardingViews();
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    closeOnboarding
  };
}
