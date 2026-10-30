import React, { useState } from 'react';
import { ITask, ITaskHistory, TaskStatus, TaskPriority } from '../types/shared';
import { TaskStatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { formatDate, formatDateTime, timeAgo } from '../lib/utils';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  X,
  History,
  Calendar,
  User,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Repeat
} from 'lucide-react';
import { CarryForwardModal } from './CarryForwardModal';

interface TaskDetailDrawerProps {
  task: ITask | null;
  onClose: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ task, onClose }) => {
  const queryClient = useQueryClient();
  const [carryModalOpen, setCarryModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch full append-only task history
  const { data: history = [], refetch: refetchHistory } = useQuery<ITaskHistory[]>({
    queryKey: ['task-history', task?._id],
    queryFn: () => api.get<ITaskHistory[]>(`/tasks/${task?._id}/history`),
    enabled: !!task?._id
  });

  if (!task) return null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsUpdating(true);
      await api.patch(`/tasks/${task._id}`, { status: newStatus });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['gaps'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
        refetchHistory()
      ]);
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.carriedForwardCount > 0 && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      Carried Forward x{task.carriedForwardCount}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">{task.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto grow space-y-6">
              {/* Quick Status Control */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Quick Status:</span>
                <div className="flex items-center gap-1.5">
                  {(['Open', 'In Progress', 'Blocked', 'Completed'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={isUpdating || task.status === st}
                      onClick={() => handleStatusChange(st)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        task.status === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocker alert if blocked */}
              {task.status === 'Blocked' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Active Blocker</span>
                  </div>
                  <p className="text-rose-900/90 leading-relaxed font-medium">
                    {task.blockerDescription || 'No blocker explanation recorded! (Continuity gap detected)'}
                  </p>
                </div>
              )}

              {/* Task Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Owner</span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {task.owner || <span className="text-rose-600 font-normal italic">Unassigned (Gap)</span>}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due Date</span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {task.dueDate ? (
                      formatDate(task.dueDate)
                    ) : (
                      <span className="text-amber-600 font-normal italic">No deadline recorded</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Dependencies */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dependencies ({task.dependencies.length})
                  </h4>
                  <div className="space-y-1">
                    {task.dependencies.map((dep, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 rounded bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center gap-1.5"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dep}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source References */}
              {task.sourceReferences && task.sourceReferences.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Originating Source References
                  </h4>
                  <div className="space-y-1.5">
                    {task.sourceReferences.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-blue-50/40 border border-blue-200/60 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-blue-900 font-medium mb-1">
                          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                          <span>{ref.title}</span>
                        </div>
                        {ref.excerpt && (
                          <p className="text-[11px] text-slate-600 italic leading-snug">
                            &ldquo;{ref.excerpt}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Append-only Task History (Section 7.2) */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Task History & Audit Log ({history.length})</span>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No history logged yet.</p>
                ) : (
                  <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 text-xs">
                    {history.map((h) => (
                      <div key={h._id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{h.eventType}</span>
                            <span className="text-[10px] text-slate-400">{timeAgo(h.createdAt)}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {h.previousValue && (
                              <span className="text-slate-400 line-through mr-1.5">
                                {h.previousValue}
                              </span>
                            )}
                            <span className="font-medium text-slate-800">{h.newValue}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">By {h.actor || 'System'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action: Carry Forward */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCarryModalOpen(true)}
                className="gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Carry Forward Task</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CarryForwardModal
        isOpen={carryModalOpen}
        onClose={() => {
          setCarryModalOpen(false);
          refetchHistory();
        }}
        task={task}
      />
    </>
  );
};
