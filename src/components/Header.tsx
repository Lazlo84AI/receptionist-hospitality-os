import { useState, useEffect } from 'react';
import { Menu, User, Clock, BarChart3, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { HotelCrest } from '@/components/HotelCrest';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, signOut } = useAuth();
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
    <header className="h-16 hotel-header border-b border-hotel-yellow/20 px-4 flex items-center justify-between">
      {/* Left: Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuToggle}
        className="text-white hotel-hover"
      >
        <Menu className="h-6 w-6" />
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
            <Clock className="h-4 w-4 text-hotel-yellow" />
            <span className="font-mono text-lg jost-semibold">
              {formatTime(currentTime)}
            </span>
          </div>
          <p className="text-xs decoeur-caption text-hotel-yellow/70">
            {formatDate(currentTime)}
          </p>
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hotel-hover">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-hotel-yellow/70">Authenticated User</p>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-[#BBA57A]/50">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="avatar-gold font-semibold">
                  {user?.email ? getUserInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex items-center space-x-2 hotel-hover">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center space-x-2 hotel-hover">
              <BarChart3 className="h-4 w-4" />
              <span>My Statistics</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer hotel-hover"
              onClick={() => navigate('/mes-shifts')}
            >
              <Calendar className="h-4 w-4" />
              <span>My Shifts</span>
            </DropdownMenuItem>
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
