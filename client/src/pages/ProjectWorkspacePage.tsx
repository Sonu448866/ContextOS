import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IProject, IKnowledgeSource, ITask, IContextGap, IKnowledgeRecord } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, TaskStatusBadge, PriorityBadge, SeverityBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '../lib/utils';
import {
  FolderKanban,
  BookOpen,
  CheckSquare,
  ShieldAlert,
  ArrowRightLeft,
  Activity,
  Plus,
  Users,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { AddKnowledgeModal } from '../features/AddKnowledgeModal';
import { CreateTaskModal } from '../features/CreateTaskModal';
import { TaskDetailDrawer } from '../features/TaskDetailDrawer';
import { ContextTransferModal } from '../features/ContextTransferModal';
import { ContextGapResolveModal } from '../features/ContextGapResolveModal';

type WorkspaceTab = 'knowledge' | 'tasks' | 'decisions' | 'gaps' | 'transfer';

export const ProjectWorkspacePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('knowledge');

  // Modals
  const [addKnowledgeOpen, setAddKnowledgeOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [selectedGap, setSelectedGap] = useState<IContextGap | null>(null);

  // Queries
  const { data: project, isLoading: projectLoading } = useQuery<IProject>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`),
    enabled: !!projectId
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<IKnowledgeSource[]>({
    queryKey: ['knowledge', projectId],
    queryFn: () => api.get(`/projects/${projectId}/knowledge`),
    enabled: !!projectId
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<ITask[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`),
    enabled: !!projectId
  });

  const { data: gaps = [], isLoading: gapsLoading } = useQuery<IContextGap[]>({
    queryKey: ['gaps', projectId],
    queryFn: () => api.get(`/projects/${projectId}/context-gaps`),
    enabled: !!projectId
  });

  if (projectLoading || !project) {
    return <LoadingSpinner size="lg" label="Loading workspace..." className="h-96" />;
  }

  const openTasks = tasks.filter((t) => ['Open', 'In Progress', 'Blocked'].includes(t.status));
  const blockedTasks = tasks.filter((t) => t.status === 'Blocked');
  const criticalGaps = gaps.filter((g) => ['Critical', 'High'].includes(g.severity) && g.status !== 'Resolved' && g.status !== 'Dismissed');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Project Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="primary">Project Workspace</Badge>
              <Badge
                variant={
                  project.status === 'Active'
                    ? 'success'
                    : project.status === 'Planning'
                    ? 'info'
                    : 'neutral'
                }
              >
                {project.status}
              </Badge>
              {criticalGaps.length > 0 && (
                <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {criticalGaps.length} Continuity Gaps
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {project.description || 'No description recorded.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
              {project.members && project.members.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{project.members.join(', ')}</span>
                </div>
              )}
              {(project.startDate || project.targetDate) && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {formatDate(project.startDate)} ➔ {formatDate(project.targetDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferModalOpen(true)}
              className="text-xs gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Generate Handover</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddKnowledgeOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Knowledge</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 mt-6 -mb-6 overflow-x-auto">
          {[
            { id: 'knowledge', label: `Knowledge Hub (${sources.length})`, icon: BookOpen },
            { id: 'tasks', label: `Tasks & Commitments (${openTasks.length})`, icon: CheckSquare },
            { id: 'gaps', label: `Context Gaps (${gaps.length})`, icon: ShieldAlert },
            { id: 'transfer', label: 'Context Transfer', icon: ArrowRightLeft }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Knowledge Hub */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Ingested Sources ({sources.length})
            </h3>
            <Button variant="outline" size="sm" onClick={() => setAddKnowledgeOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              <span>New Source Document</span>
            </Button>
          </div>

          {sources.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No knowledge sources ingested</p>
              <p className="text-xs text-slate-400 mt-0.5 mb-3">
                Paste meeting notes, upload PDF/DOCX or add decision updates.
              </p>
              <Button variant="primary" size="sm" onClick={() => setAddKnowledgeOpen(true)}>
                Add Knowledge
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((s) => (
                <Card key={s._id} className="p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                        {s.sourceType}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(s.createdAt)}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {s.originalText}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">By {s.author || 'Contributor'}</span>
                    <Link to="/knowledge">
                      <Button variant="ghost" size="sm" className="text-xs text-brand-600 gap-1 p-0">
                        <span>Open & Extract</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Tasks & Commitments ({tasks.length})
            </h3>
            <Button variant="primary" size="sm" onClick={() => setCreateTaskOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No tasks created yet</p>
              <p className="text-xs text-slate-400 mt-0.5 mb-3">
                Create tasks manually or extract action items from knowledge sources.
              </p>
              <Button variant="primary" size="sm" onClick={() => setCreateTaskOpen(true)}>
                New Task
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 grow">
                    <div className="flex items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.carriedForwardCount > 0 && (
                        <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                          Carried Forward x{task.carriedForwardCount}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>

                    {task.status === 'Blocked' && task.blockerDescription && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        ⚠️ Blocker: {task.blockerDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Owner: {task.owner || <span className="text-rose-500 font-semibold">Unassigned</span>}</span>
                      <span>•</span>
                      <span>Due: {task.dueDate ? formatDate(task.dueDate) : <span className="text-amber-500 font-medium">No deadline</span>}</span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Context Gaps */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Context Continuity Gaps ({gaps.length})
            </h3>
            <Link to="/context-gaps">
              <Button variant="outline" size="sm">
                Open Full Gap Detector
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gaps.map((g) => (
              <Card
                key={g._id}
                onClick={() => setSelectedGap(g)}
                className="p-4 hover:border-brand-500/50 cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <SeverityBadge severity={g.severity} />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {g.detectionMethod} Check
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{g.description}</h4>
                  {g.evidence && (
                    <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2">
                      &ldquo;{g.evidence}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-medium">
                  <span>Resolution: {g.recommendedResolution}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Context Transfer */}
      {activeTab === 'transfer' && (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Context Transfer Engine</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Compile background, Razorpay payment decisions, ongoing investigations, unblocked test schedules, and open tasks into an audit-ready 17-part handover brief.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setTransferModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Handover Package</span>
          </Button>
        </div>
      )}

      {/* Modals & Drawers */}
      <AddKnowledgeModal isOpen={addKnowledgeOpen} onClose={() => setAddKnowledgeOpen(false)} />
      <CreateTaskModal isOpen={createTaskOpen} onClose={() => setCreateTaskOpen(false)} />
      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
      <ContextGapResolveModal gap={selectedGap} onClose={() => setSelectedGap(null)} />
      <ContextTransferModal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
    </div>
  );
};
