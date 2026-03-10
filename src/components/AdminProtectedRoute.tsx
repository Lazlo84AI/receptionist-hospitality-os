import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStaffService } from '@/hooks/useStaffService';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * AdminProtectedRoute
 * Guards all /admin/* routes.
 * Allows access only if authenticated AND service === 'direction'.
 * Redirects to /shift otherwise.
 */
const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isDirection, loading: serviceLoading } = useStaffService();
  const navigate = useNavigate();

  const loading = authLoading || serviceLoading;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!isDirection) {
        navigate('/shift');
      }
    }
  }, [user, isDirection, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1E1A37' }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} />
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.6)' }}>
            Vérification des accès...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isDirection) return null;

  return <>{children}</>;
};

export default AdminProtectedRoute;
