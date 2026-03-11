import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  BarChart3,
  GraduationCap,
  Brain,
  LogOut,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminMenuItems = [
  { icon: BarChart3,     label: 'Team Analytics',       href: '/admin/analytics' },
  { icon: GraduationCap, label: 'Training Management',  href: '/admin/training' },
  { icon: Brain,         label: 'Knowledge Assistance', href: '/admin/knowledge' },
  { icon: UserPlus,      label: 'Team Onboarding',      href: '/admin/onboarding' },
];

// Gold Dark — charte Decœur Pantone 4006C
const GOLD_BG = '#BBA57A';

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleMenuClick = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleBackToApp = () => {
    navigate('/shift');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar — fond gold, texte blanc */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out border-r',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: GOLD_BG,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.25)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white drop-shadow-sm">
                Administration
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Direction · Sokle OS
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Logo blanc */}
              <img
                src="/decoeur-crest.svg"
                alt="Decœur Hotels Blason"
                className="w-8 h-8 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-6">
          <p
            className="text-[10px] uppercase tracking-widest mb-4 font-semibold"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Menu Direction
          </p>

          <div className="space-y-2">
            {adminMenuItems.map((item, index) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleMenuClick(item.href)}
                  className={cn(
                    'w-full justify-start text-left h-12 transition-all duration-300 font-medium',
                    isActive
                      ? 'shadow-md border'
                      : ''
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'rgba(0,0,0,0.18)',
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.25)',
                        }
                      : { color: 'white' }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'rgba(30,26,55,0.12)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#DEAE35';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'white';
                    }
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Separator */}
          <div
            className="my-6 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)',
            }}
          />

          {/* Retour App */}
          <Button
            variant="ghost"
            onClick={handleBackToApp}
            className="w-full justify-start text-left h-12 transition-all duration-300 font-medium"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(30,26,55,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'white';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span>Retour App</span>
          </Button>

          {/* Sign Out */}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-left h-12 transition-all duration-300 font-medium mt-1"
            style={{ color: 'rgba(220,80,80,0.85)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(220,38,38,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgb(239,68,68)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(220,80,80,0.85)';
            }}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Sign Out</span>
          </Button>

          {/* Blason blanc centré en bas */}
          <div className="mt-10 flex justify-center">
            <img
              src="/decoeur-crest.svg"
              alt="Decœur Hotels Blason"
              className="w-16 h-16 object-contain opacity-40 hover:opacity-70 transition-opacity duration-300"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </nav>
      </div>
    </>
  );
}
