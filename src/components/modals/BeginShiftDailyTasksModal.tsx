import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeginShiftDailyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithCreation: () => void;
  onWithoutCreation: () => void;
}

const BeginShiftDailyTasksModal: React.FC<BeginShiftDailyTasksModalProps> = ({
  isOpen,
  onClose,
  onWithCreation,
  onWithoutCreation
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Begin shift - Daily tasks creation
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold text-gray-900">
              Begin the shift by
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose how you want to start your service shift today
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* With Creation Option */}
            <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-colors">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  With creation
                </h3>
                <div className="space-y-3">
                  <p className="font-medium text-gray-800 text-lg">
                    Creation of daily task cards
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Generate automatic daily task cards for all rooms and common areas based on your hotel's standard procedures.
                  </p>
                </div>
                <Button 
                  onClick={onWithCreation}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-4 text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Daily Tasks
                </Button>
              </div>
            </div>

            {/* Without Creation Option */}
            <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-colors">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <X className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Without creation
                </h3>
                <div className="space-y-3">
                  <p className="font-medium text-gray-800 text-lg">
                    Start with existing tasks only
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Begin your shift with only existing tasks and incidents. You can manually add new tasks as needed during your shift.
                  </p>
                </div>
                <Button 
                  onClick={onWithoutCreation}
                  variant="outline"
                  className="w-full border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-medium py-4 text-lg"
                >
                  Start Without Tasks
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              You can change this preference later in your settings
            </p>
          </div>

          <div className="flex justify-between pt-6">
            <div></div> {/* Spacer */}
            <Button variant="ghost" onClick={onClose} className="text-gray-600">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeginShiftDailyTasksModal;
