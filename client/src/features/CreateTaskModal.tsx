import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { TaskPriority, TaskStatus } from '../types/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Open');
  const [blockerDescription, setBlockerDescription] = useState('');
  const [dependencies, setDependencies] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('No active project selected');
      return;
    }
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const parsedDeps = dependencies
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await api.post(`/projects/${selectedProjectId}/tasks`, {
        title: title.trim(),
        description: description.trim(),
        owner: owner.trim() || null,
        dueDate: dueDate || null,
        priority,
        status,
        dependencies: parsedDeps,
        blockerDescription: status === 'Blocked' ? blockerDescription.trim() : null
      });

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['gaps'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      setTitle('');
      setDescription('');
      setOwner('');
      setDueDate('');
      setBlockerDescription('');
      setDependencies('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Record an action item, commitment, or deliverable."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Resolve payment integration and webhook verification"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope, technical requirements, or acceptance criteria..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Owner (Optional)</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {status === 'Blocked' && (
          <div>
            <label className="block text-xs font-medium text-rose-700 mb-1">
              Blocker Explanation (Required when Blocked)
            </label>
            <input
              type="text"
              value={blockerDescription}
              onChange={(e) => setBlockerDescription(e.target.value)}
              placeholder="What specifically is blocking progress?"
              className="w-full text-xs bg-rose-50/50 border border-rose-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500/20 focus:outline-none text-rose-900"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Dependencies (Task Titles or IDs, comma-separated)
          </label>
          <input
            type="text"
            value={dependencies}
            onChange={(e) => setDependencies(e.target.value)}
            placeholder="e.g. Resolve payment integration and webhook verification"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
