import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TransferType } from '../types/shared';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';

interface ContextTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transferId: string) => void;
}

export const ContextTransferModal: React.FC<ContextTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { selectedProjectId, selectedProject } = useProject();
  const queryClient = useQueryClient();

  const [transferType, setTransferType] = useState<TransferType>('Role Handover');
  const [outgoingOwner, setOutgoingOwner] = useState('Rahul Sharma');
  const [incomingOwner, setIncomingOwner] = useState('New Payment Lead');
  const [period, setPeriod] = useState('All Time');
  const [instructions, setInstructions] = useState(
    'Highlight Razorpay payment integration blockers, failing webhook verification root causes, Priya checkout dependencies, and open tasks.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select an active project');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await api.post<any>(`/projects/${selectedProjectId}/context-transfers/generate`, {
        transferType,
        outgoingOwner: outgoingOwner.trim() || undefined,
        incomingOwner: incomingOwner.trim() || undefined,
        period: period.trim() || undefined,
        instructions: instructions.trim() || undefined
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transfers'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      ]);

      if (onSuccess && result._id) {
        onSuccess(result._id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate context transfer handover');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Context Transfer Handover"
      description={`Synthesize a high-fidelity 17-part handover package for "${selectedProject?.name || 'Current Project'}".`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs flex items-center gap-2 text-blue-900">
          <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            The engine compiles background, decisions & rationale, blockers, open tasks, risks, and missing context into a structured audit-ready brief.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Type</label>
          <select
            value={transferType}
            onChange={(e) => setTransferType(e.target.value as TransferType)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          >
            <option value="Role Handover">Role Handover (Owner Departure / Reassignment)</option>
            <option value="Full Project">Full Project Overview Handover</option>
            <option value="Workstream">Workstream Specific Transfer</option>
            <option value="Task Set">Selected Task Set Transfer</option>
            <option value="New Member Onboarding">New Member Onboarding Brief</option>
            <option value="Meeting Catchup">Meeting Catchup (Missed Sprint Syncs)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Outgoing Owner</label>
            <input
              type="text"
              value={outgoingOwner}
              onChange={(e) => setOutgoingOwner(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Incoming Owner</label>
            <input
              type="text"
              value={incomingOwner}
              onChange={(e) => setIncomingOwner(e.target.value)}
              placeholder="e.g. Next Lead Engineer"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Relevant Period / Scope</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g. Current Sprint, Past 30 Days, All Time"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Custom Focus Instructions</label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Specific topics, warnings, or systems the recipient should focus on..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Generate Context Handover</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
