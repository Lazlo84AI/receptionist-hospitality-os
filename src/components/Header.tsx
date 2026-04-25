import { useState, useEffect } from 'react';
import { Menu, User, Clock, BarChart3, GraduationCap, Calendar, LogOut, ShieldCheck } from 'lucide-react';
import { HelpButton } from '@/components/help/HelpButton';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useStaffService } from '@/hooks/useStaffService';
import { HotelCrest } from '@/components/HotelCrest';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, signOut } = useAuth();
  const { isDirection } = useStaffService();
  const navigate = useNavigate();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-16 hotel-header border-b border-hotel-yellow/20 px-4 flex items-center justify-between">
      {/* Left: Menu Toggle */}
      <Button
        variant="ghost"
        size="lg"
        onClick={onMenuToggle}
        className="hotel-hover flex items-center"
      >
        <Menu className="h-10 w-10 text-white" />
        <span className="ml-2 text-hotel-gold-dark jost-semibold hidden sm:block">MENU</span>
      </Button>

      {/* Center: Hotel Crest */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <HotelCrest className="w-8 h-10" />
      </div>

      {/* Right: Time, Date & User */}
      <div className="flex items-center space-x-4">
        {/* Time & Date */}
        <div className="hidden lg:block text-right">
          <div className="flex items-center space-x-2 text-white">
            <Clock className="h-4 w-4" style={{ color: '#E0D3B4' }} />
            <span className="font-mono text-lg jost-semibold">
              {formatTime(currentTime)}
            </span>
          </div>
          <p className="text-xs decoeur-caption text-hotel-sand">
            {formatDate(currentTime)}
          </p>
        </div>

        {/* Help Button */}
        <HelpButton />

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hotel-hover p-1">
              <Avatar className="h-10 w-10 ring-2 ring-[#BBA57A]/50">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="avatar-gold font-semibold">
                  {user?.email ? getUserInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Email & rôle — informatif, non cliquable */}
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
              <p className="text-xs text-gray-400">Authenticated User</p>
            </div>
            <DropdownMenuItem
              className="flex items-center space-x-2 hotel-hover mt-1 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center space-x-2 hotel-hover cursor-pointer"
              onClick={() => navigate('/my-statistics')}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Tasks Analytics</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center space-x-2 hotel-hover cursor-pointer"
              onClick={() => navigate('/training-statistics')}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Training Statistics</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer hotel-hover"
              onClick={() => navigate('/team-shifts')}
            >
              <Calendar className="h-4 w-4" />
              <span>Team Shifts</span>
            </DropdownMenuItem>
            {isDirection && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center space-x-2 cursor-pointer mx-2 mb-1 rounded-md"
                  style={{ backgroundColor: '#BBA57A', color: '#1E1A37' }}
                  onClick={() => navigate('/admin/onboarding')}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-medium">Accès Admin</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer text-red-600 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
