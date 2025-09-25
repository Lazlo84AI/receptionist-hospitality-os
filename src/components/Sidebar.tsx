import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  RefreshCw, 
  BookOpen, 
  Search, 
  Users,
  Settings,
  LogOut,
  X,
  GraduationCap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: RefreshCw, label: 'Shift Management', href: '/shift' },
  { icon: Users, label: 'Team Dispatch', href: '/team-dispatch' },
  { icon: Settings, label: 'Service Control', href: '/service-control2' },
  { icon: BookOpen, label: 'Knowledge Base', href: '/connaissances' },
  { icon: GraduationCap, label: 'Training Management', href: '/training' },
  { icon: Search, label: 'Assistant', href: '/assistant' },
  { icon: LogOut, label: 'Sign Out', href: '/logout', danger: true },
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
      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-hotel-navy/20 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 border-r border-hotel-yellow/20 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ backgroundColor: '#1E1A37' }}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-hotel-yellow/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl jost-semibold text-white">
                Navigation
              </h2>
              <p className="text-sm decoeur-body-emphasis text-hotel-yellow/70">
                Opérations Decœur Hotels
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <img 
                src="/decoeur-crest.svg"
                alt="Decœur Hotels Blason"
                className="w-8 h-8 object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:text-hotel-yellow hover:bg-hotel-yellow/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
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
                      ? "gold-metallic-gradient text-hotel-navy hover:shadow-xl border border-hotel-gold-dark/30 shadow-lg" 
                      : item.danger
                        ? "text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        : "text-white hover:text-hotel-yellow hover:bg-hotel-yellow/10"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="my-8 h-px bg-gradient-to-r from-transparent via-hotel-yellow/30 to-transparent" />

          {/* Status Indicator */}
          <div className="rounded-lg p-4 border border-hotel-yellow/20" style={{ backgroundColor: '#1E1A37' }}>
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-white">
                  Système Opérationnel
                </p>
                <p className="text-xs text-hotel-yellow/70">
                  Tous services actifs
                </p>
              </div>
            </div>
          </div>
          
          {/* Blason Decœur */}
          <div className="mt-6 flex justify-center">
            <img 
              src="/decoeur-crest.svg"
              alt="Decœur Hotels Blason"
              className="w-16 h-16 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </nav>
      </div>
    </>
  );
}
