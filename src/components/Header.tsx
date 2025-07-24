import { useState } from 'react';
import { Menu, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QuickActionButton } from '@/components/QuickActionButton';
import hotelCrest from '@/assets/hotel-crest.jpg';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
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

      {/* Center: Dashboard Title */}
      <div className="flex items-center">
        <h1 className="text-lg font-playfair font-semibold text-warm-cream">
          Dashboard: Reception View
        </h1>
      </div>

      {/* Right: Quick Action, Time, Date & User */}
      <div className="flex items-center space-x-4">
        {/* Quick Action Button */}
        <QuickActionButton />

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
        <div className="flex items-center space-x-2">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-warm-cream">Marie Dubois</p>
            <p className="text-xs text-soft-pewter">Reception Manager</p>
          </div>
          <Avatar className="h-10 w-10 ring-2 ring-champagne-gold/50">
            <AvatarImage src="/api/placeholder/40/40" />
            <AvatarFallback className="bg-champagne-gold text-palace-navy font-semibold">
              MD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}