import { useState } from 'react';
import { Menu, User, Clock, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import hotelCrest from '@/assets/hotel-crest.jpg';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Update time every minute
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  });

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

  return (
    <header className="h-16 bg-palace-navy/95 backdrop-blur-md border-b border-champagne-gold/20 px-4 flex items-center justify-between">
      {/* Left: Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuToggle}
        className="text-warm-cream hover:text-champagne-gold hover:bg-champagne-gold/10 transition-all duration-300"
      >
        <Menu className="h-6 w-6" />
      </Button>


      {/* Right: Time, Date & User */}
      <div className="flex items-center space-x-4">
        {/* Time & Date */}
        <div className="hidden lg:block text-right">
          <div className="flex items-center space-x-2 text-warm-cream">
            <Clock className="h-4 w-4 text-champagne-gold" />
            <span className="font-mono text-lg font-semibold">
              {formatTime(currentTime)}
            </span>
          </div>
          <p className="text-xs text-soft-pewter">
            {formatDate(currentTime)}
          </p>
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-champagne-gold/10">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-warm-cream">Marie Dubois</p>
                <p className="text-xs text-soft-pewter">Chef de Réception</p>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-champagne-gold/50">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="bg-champagne-gold text-palace-navy font-semibold">
                  MD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Mes statistiques</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/mes-shifts')}
            >
              <Calendar className="h-4 w-4" />
              <span>Mes shifts</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}