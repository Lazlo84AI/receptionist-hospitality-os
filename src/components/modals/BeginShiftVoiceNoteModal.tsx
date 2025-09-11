import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, PlayCircle, FileAudio, FileText } from 'lucide-react';
import { useLatestShiftHandover } from '@/hooks/useShiftData';

interface BeginShiftVoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const BeginShiftVoiceNoteModal: React.FC<BeginShiftVoiceNoteModalProps> = ({
  isOpen,
  onClose,
  onContinue
}) => {
  const { shiftData, loading: shiftDataLoading, error: shiftDataError } = useLatestShiftHandover();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Begin Service Shift - Voice Note Review
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold mb-2">
              {shiftData ? 'Voice Note from Your Predecessor' : 'Shift Handover Information'}
            </h3>
            <p className="text-gray-600">
              {shiftData 
                ? `Key information from ${shiftData.previous_shift_user || 'the previous team'}` 
                : 'No handover data available from previous shift'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Audio Player - Left side */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-blue-600" />
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shiftData?.voice_note_url ? (
                  <div className="space-y-4">
                    {/* Audio element */}
                    <audio 
                      controls 
                      className="w-full"
                      preload="metadata"
                    >
                      <source src={shiftData.voice_note_url} type="audio/mpeg" />
                      <source src={shiftData.voice_note_url} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Left by:</strong> {shiftData.previous_shift_user || 'Previous team member'}
                      </p>
                      {shiftData.previous_shift_end_time && (
                        <p className="text-sm text-blue-700 mt-1">
                          <strong>Time:</strong> {new Date(shiftData.previous_shift_end_time).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileAudio className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium mb-2">
                      No voice note available
                    </p>
                    <p className="text-sm text-gray-400">
                      The previous shift didn't leave any audio message
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Transcript or Handover Notes - Right side */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  {shiftData?.voice_note_transcription ? 'Transcription of the Voice Note' : 'Handover Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(shiftData?.voice_note_transcription || shiftData?.handover_notes) ? (
                  <div className="max-h-80 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm leading-relaxed space-y-3">
                      {shiftData.voice_note_transcription && (
                        <div className="space-y-3">
                          {shiftData.voice_note_transcription.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="text-gray-800">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}
                      {shiftData.handover_notes && !shiftData.voice_note_transcription && (
                        <div className="space-y-2">
                          {shiftData.handover_notes.split('\n').map((line, index) => (
                            <p key={index} className="text-gray-800">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium mb-2">
                      No transcription or notes available
                    </p>
                    <p className="text-sm text-gray-400">
                      The previous shift didn't leave any written information
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Information Panel */}
          {shiftData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-yellow-800 mb-2">Shift Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-yellow-700 font-medium">Previous Shift:</span>
                  <p className="text-yellow-600">{shiftData.previous_shift_user || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">Shift End:</span>
                  <p className="text-yellow-600">
                    {shiftData.previous_shift_end_time 
                      ? new Date(shiftData.previous_shift_end_time).toLocaleString('fr-FR')
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-yellow-700 font-medium">Status:</span>
                  <p className="text-yellow-600">Ready for review</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="ghost" onClick={onClose} className="text-gray-600">
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                Continue to Task Allocation
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeginShiftVoiceNoteModal;
