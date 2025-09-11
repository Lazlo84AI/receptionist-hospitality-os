import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench 
} from 'lucide-react';

/**
 * Composant exemple montrant l'utilisation du système de hover unifié
 * Couleur: Yellow RAL Pantone 6004C HTML #DEAE35
 */

const UnifiedHoverExample = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const cardCategories = [
    { 
      id: 'ongoing-incident', 
      label: 'Ongoing Incident', 
      icon: AlertTriangle,
      description: 'Immediate attention required'
    },
    { 
      id: 'client-request', 
      label: 'Client Request', 
      icon: Users,
      description: 'Guest service request'
    },
    { 
      id: 'follow-up', 
      label: 'Follow-up', 
      icon: Clock,
      description: 'Scheduled follow-up task'
    },
    { 
      id: 'internal-task', 
      label: 'Internal Task', 
      icon: Wrench,
      description: 'Staff internal task'
    },
  ];

  const priorities = [
    { id: 'normal', label: 'Normal' },
    { id: 'urgent', label: 'Urgent' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-playfair font-bold text-hotel-navy">
            Système de Hover Unifié - Jaune Hôtel
          </h2>
          <p className="text-hotel-navy/70">
            Couleur: Yellow RAL Pantone 6004C HTML #DEAE35
          </p>
        </div>

        {/* Card Categories - Unified Hover */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-hotel-navy">Card Category *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cardCategories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'card-category-button',
                    isSelected && 'selected'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5 text-hotel-navy" />
                    <div>
                      <div className="font-medium text-hotel-navy">{category.label}</div>
                      <div className="text-sm text-hotel-navy/60">{category.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Buttons - Unified Hover */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-hotel-navy">Priority Level *</h3>
          <div className="flex gap-2">
            {priorities.map((priority) => {
              const isSelected = selectedPriority === priority.id;
              
              return (
                <Button
                  key={priority.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPriority(priority.id)}
                  className={cn(
                    'priority-button',
                    isSelected && 'selected'
                  )}
                >
                  {priority.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Form Fields - Unified Hover */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-hotel-navy">Form Elements with Unified Hover</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-hotel-navy">Card Title</label>
              <Input
                placeholder="Enter card title"
                className="hotel-hover"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-hotel-navy">Select Service</label>
              <Select>
                <SelectTrigger className="hotel-hover">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="concierge">Concierge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-hotel-navy">Description</label>
            <Textarea
              placeholder="Describe the task or request..."
              rows={4}
              className="hotel-hover"
            />
          </div>
        </div>

        {/* Button Examples - Unified Hover */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-hotel-navy">Button Variants with Unified Hover</h3>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="default">
              Default Button
            </Button>
            
            <Button variant="outline">
              Outline Button
            </Button>
            
            <Button variant="secondary">
              Secondary Button
            </Button>
            
            <Button variant="ghost">
              Ghost Button
            </Button>
            
            <Button variant="link">
              Link Button
            </Button>
          </div>
        </div>

        {/* Card with Hover Effect */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-hotel-navy">Card with Unified Hover</h3>
          
          <Card className="hotel-hover cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-hotel-navy">Example Task Card</h4>
                  <p className="text-sm text-hotel-navy/60">This card demonstrates the unified hover effect</p>
                </div>
                <div className="text-sm text-hotel-navy/60">
                  2 hours ago
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link with Hover */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-hotel-navy">Text Links with Unified Hover</h3>
          
          <div className="space-y-2">
            <p>
              <a href="#" className="hotel-text-hover underline">
                This is a link with unified hover
              </a>
            </p>
            <p>
              Need help? 
              <a href="#" className="hotel-text-hover ml-1 underline">
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button variant="outline">
            Cancel
          </Button>
          <Button>
            Create Card
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedHoverExample;
