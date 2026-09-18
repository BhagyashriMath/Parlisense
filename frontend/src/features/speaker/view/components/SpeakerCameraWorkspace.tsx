import React from 'react';
import { ChamberVideoGrid } from '../../../../shared/components/ChamberVideoGrid';
import { LiveTranscript } from '../../../chamber-monitoring/view/LiveTranscript';
import { CameraViewMode } from '../../model/speaker.types';
import { Member } from '../../../../shared/types';

interface SpeakerCameraWorkspaceProps {
  cameraMode?: CameraViewMode;
  onCameraModeChange?: (mode: CameraViewMode) => void;
  activeSpeakerMember?: Member | undefined;
  members?: Member[];
}

export const SpeakerCameraWorkspace: React.FC<SpeakerCameraWorkspaceProps> = () => {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
      {/* Multi-Participant Chamber Video Feeds (Speaker Only + Vision Presence) */}
      <div className="flex-1 min-h-0">
        <ChamberVideoGrid memberCameras={false} />
      </div>

      {/* Live STT Transcript Panel */}
      <div className="h-72 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm flex flex-col">
        <LiveTranscript textOnly={true} />
      </div>
    </div>
  );
};
