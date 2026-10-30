import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { IContextGap, GapStatus } from '../types/shared';
import { SeverityBadge, GapStatusBadge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, Eye, Ban, Sparkles, FileText } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

interface ContextGapResolveModalProps {
  gap: IContextGap | null;
  onClose: () => void;
}

export const ContextGapResolveModal: React.FC<ContextGapResolveModalProps> = ({ gap, onClose }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  if (!gap) return null;

  const handleStatusChange = async (status: GapStatus) => {
    try {
      setIsLoading(true);
      await api.patch(`/context-gaps/${gap._id}`, { status });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gaps'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] })
      ]);

      onClose();
    } catch (err) {
      console.error('Failed to update gap status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!gap}
      onClose={onClose}
      title="Context Gap Analysis & Resolution"
      description={`Inspect detected continuity risk (${gap.gapType}) and record resolution.`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Badges & Meta */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={gap.severity} />
            <GapStatusBadge status={gap.status} />
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
              {gap.detectionMethod} Check
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Detected: {formatDateTime(gap.detectedAt)}
          </span>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Gap Finding
          </h4>
          <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-snug">
            {gap.description}
          </p>
        </div>

        {/* Evidence */}
        {gap.evidence && (
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Supporting Evidence / Citation</span>
            </h4>
            <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg text-xs text-amber-950 font-mono leading-relaxed">
              &ldquo;{gap.evidence}&rdquo;
            </div>
          </div>
        )}

        {/* Recommended Resolution */}
        <div>
          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recommended Resolution</span>
          </h4>
          <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg text-xs text-emerald-950 leading-relaxed font-medium">
            {gap.recommendedResolution}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || gap.status === 'Acknowledged'}
              onClick={() => handleStatusChange('Acknowledged')}
              className="text-xs gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Acknowledge Risk</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading || gap.status === 'Dismissed'}
              onClick={() => handleStatusChange('Dismissed')}
              className="text-xs gap-1 text-slate-500 hover:text-slate-800"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Dismiss False Positive</span>
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={isLoading || gap.status === 'Resolved'}
            onClick={() => handleStatusChange('Resolved')}
            className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Resolved</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
