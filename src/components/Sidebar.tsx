import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  RefreshCw, 
  BookOpen, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: RefreshCw, label: 'Gestion de son shift', href: '/shift' },
  { icon: BookOpen, label: 'Base de Connaissance', href: '/knowledge' },
  { icon: Settings, label: 'Paramètres', href: '/settings' },
  { icon: LogOut, label: 'Déconnexion', href: '/logout', danger: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (href: string) => {
    navigate(href);
    onClose();
  };
  return (
    <>
      {/* Backdrop Blur Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-palace-navy/20 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 bg-palace-navy border-r border-champagne-gold/20 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-champagne-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-playfair font-semibold text-warm-cream">
                Navigation
              </h2>
              <p className="text-sm text-soft-pewter">
                Operations Palace
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-warm-cream hover:text-champagne-gold hover:bg-champagne-gold/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-6">
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={index}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => handleMenuClick(item.href)}
                  className={cn(
                    "w-full justify-start text-left h-12 transition-all duration-300",
                    isActive 
                      ? "bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90 shadow-lg" 
                      : item.danger
                        ? "text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        : "text-warm-cream hover:text-champagne-gold hover:bg-champagne-gold/10"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Luxury Separator */}
          <div className="my-8 h-px bg-gradient-to-r from-transparent via-champagne-gold/30 to-transparent" />

          {/* Status Indicator */}
          <div className="glass-morphism rounded-lg p-4 border border-champagne-gold/20">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 rounded-full bg-success-green animate-pulse" />
              <div>
                <p className="text-sm font-medium text-warm-cream">
                  Système Opérationnel
                </p>
                <p className="text-xs text-soft-pewter">
                  Tous services actifs
                </p>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}