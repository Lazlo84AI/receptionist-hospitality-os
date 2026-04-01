import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Afficher une seule fois par session
    const sessionKey = `onboarding_shown_${user.id}`;
    const alreadyShownThisSession = sessionStorage.getItem(sessionKey);

    if (alreadyShownThisSession === 'true') {
      setIsLoading(false);
      setShouldShowOnboarding(false);
      return;
    }

    sessionStorage.setItem(sessionKey, 'true');
    setShouldShowOnboarding(true);
    setIsLoading(false);
  }, [user?.id]);

  const closeOnboarding = () => {
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    closeOnboarding
  };
}
