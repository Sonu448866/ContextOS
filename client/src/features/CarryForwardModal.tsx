import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ITask } from '../types/shared';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Repeat, AlertCircle } from 'lucide-react';

interface CarryForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ITask;
}

export const CarryForwardModal: React.FC<CarryForwardModalProps> = ({ isOpen, onClose, task }) => {
  const queryClient = useQueryClient();
  const [cycleLabel, setCycleLabel] = useState('Next Sprint / Meeting Cycle');
  const [reason, setReason] = useState(
    task.status === 'Blocked'
      ? `Blocked: ${task.blockerDescription || 'Pending upstream resolution'}`
      : 'Incomplete work carried forward into subsequent cycle'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      await api.post(`/tasks/${task._id}/carry-forward`, {
        newCycleLabel: cycleLabel,
        reason
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['task-history', task._id] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] })
      ]);

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to carry forward task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carry Forward Open Task"
      description={`Carry forward "${task.title}" to the next agenda or work cycle without duplicating task identity.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-purple-900">
            <Repeat className="w-4 h-4 text-purple-600" />
            <span>Identity & History Preservation</span>
          </div>
          <p className="text-purple-950/80 leading-relaxed">
            The task retains its unique ID <code className="font-mono bg-purple-100 px-1 rounded">{task._id}</code>, original creation date, past owners, and full decision linkages.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Target Cycle / Meeting Label</label>
          <input
            type="text"
            value={cycleLabel}
            onChange={(e) => setCycleLabel(e.target.value)}
            placeholder="e.g. Sprint 24 Planning, Next Tuesday Sync"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Carry Forward Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} className="bg-purple-600 hover:bg-purple-700">
            Confirm Carry Forward
          </Button>
        </div>
      </form>
    </Modal>
  );
};
