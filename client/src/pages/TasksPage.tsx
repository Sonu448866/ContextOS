import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { ITask, TaskStatus, TaskPriority } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskStatusBadge, PriorityBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '../lib/utils';
import { CreateTaskModal } from '../features/CreateTaskModal';
import { TaskDetailDrawer } from '../features/TaskDetailDrawer';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Repeat,
  AlertTriangle,
  ArrowRight,
  User,
  Calendar
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const { data: tasks = [], isLoading } = useQuery<ITask[]>({
    queryKey: ['tasks', selectedProjectId, statusFilter, priorityFilter],
    queryFn: () =>
      selectedProjectId
        ? api.get<ITask[]>(`/projects/${selectedProjectId}/tasks`, {
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            priority: priorityFilter === 'ALL' ? undefined : priorityFilter
          })
        : Promise.resolve([]),
    enabled: !!selectedProjectId
  });

  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.owner && t.owner.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleQuickStatus = async (e: React.MouseEvent, taskId: string, newStatus: TaskStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['gaps'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks & Commitments</h1>
          <p className="text-xs text-slate-500 mt-1">
            First-class commitments with full append-only history, dependency tracking, and carry-forward continuity.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
        <div className="relative grow md:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, owners, dependencies..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {['ALL', 'Open', 'In Progress', 'Blocked', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / Cards */}
      {isLoading ? (
        <LoadingSpinner label="Loading tasks and history..." className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No tasks match your filters</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create an action item or clear current filter parameters.
          </p>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            Create Task
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filtered.map((task) => (
            <div
              key={task._id}
              onClick={() => setSelectedTask(task)}
              className="p-4 sm:px-5 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 grow">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />

                  {task.carriedForwardCount > 0 && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      Carried Forward x{task.carriedForwardCount}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {task.title}
                </h3>

                {task.status === 'Blocked' && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="font-medium">
                      {task.blockerDescription || 'Blocked without recorded reason! (Context Gap)'}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>
                      {task.owner || (
                        <span className="text-rose-600 font-semibold italic">Unassigned (Gap)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {task.dueDate ? (
                        formatDate(task.dueDate)
                      ) : (
                        <span className="text-amber-600 font-medium italic">No deadline</span>
                      )}
                    </span>
                  </div>

                  {task.dependencies && task.dependencies.length > 0 && (
                    <span className="text-slate-400">
                      Depends on: <strong className="text-slate-700">{task.dependencies.join(', ')}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions & Detail Trigger */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <select
                  value={task.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleQuickStatus(e as any, task._id, e.target.value as TaskStatus)}
                  className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>

                <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-slate-700">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};
