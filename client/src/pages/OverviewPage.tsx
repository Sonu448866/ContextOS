import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { DashboardSummary } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { SeverityBadge, TaskStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '../lib/utils';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  BookOpen,
  CheckSquare,
  AlertOctagon,
  Clock,
  UserX,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ArrowRightLeft,
  MessageSquareCode,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ContextGapResolveModal } from '../features/ContextGapResolveModal';
import { CreateTaskModal } from '../features/CreateTaskModal';

export const OverviewPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const { data: summary, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', selectedProjectId],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary', { projectId: selectedProjectId || undefined }),
    refetchInterval: 15000
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Calculating project context metrics..." className="h-96" />;
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
        Failed to load dashboard metrics. Ensure MongoDB and ContextOS server are running.
      </div>
    );
  }

  const { projectHealth } = summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {selectedProject ? selectedProject.name : 'ContextOS Platform Overview'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time organizational context, commitments, continuity gaps, and handover health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/ask">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-white">
              <MessageSquareCode className="w-3.5 h-3.5 text-brand-600" />
              <span>Ask Project</span>
            </Button>
          </Link>
          <Link to="/context-transfer">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-white">
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
              <span>Transfer Context</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateTaskOpen(true)}
            className="text-xs gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Project Health Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          projectHealth.status === 'Healthy'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : projectHealth.status === 'At Risk'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              projectHealth.status === 'Healthy'
                ? 'bg-emerald-100 text-emerald-700'
                : projectHealth.status === 'At Risk'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {projectHealth.status === 'Healthy' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : projectHealth.status === 'At Risk' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <AlertOctagon className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Project Health: {projectHealth.status}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/80 border border-current">
                Score: {projectHealth.score}/100
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">{projectHealth.summary}</p>
          </div>
        </div>

        <Link to="/context-gaps">
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white/90 hover:bg-white shrink-0 border-current"
          >
            <span>Review {summary.criticalContextGaps} Critical Gaps</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link to="/projects" className="group">
          <Card className="hover:border-slate-300 transition-all p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Projects
              </span>
              <FolderKanban className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalActiveProjects}</div>
            <div className="text-[10px] text-slate-400 mt-1">Active workspaces</div>
          </Card>
        </Link>

        <Link to="/knowledge" className="group">
          <Card className="hover:border-slate-300 transition-all p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Sources
              </span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalKnowledgeSources}</div>
            <div className="text-[10px] text-slate-400 mt-1">Ingested documents</div>
          </Card>
        </Link>

        <Link to="/tasks" className="group">
          <Card className="hover:border-slate-300 transition-all p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Open Tasks
              </span>
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.openTasks}</div>
            <div className="text-[10px] text-slate-400 mt-1">In progress & open</div>
          </Card>
        </Link>

        <Link to="/tasks?status=Blocked" className="group">
          <Card className="hover:border-rose-300 transition-all p-4 bg-rose-50/20 border-rose-200/60">
            <div className="flex items-center justify-between text-rose-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Blocked</span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700">{summary.blockedTasks}</div>
            <div className="text-[10px] text-rose-600/80 mt-1">Requiring unblocking</div>
          </Card>
        </Link>

        <Link to="/tasks" className="group">
          <Card className="hover:border-amber-300 transition-all p-4 bg-amber-50/20 border-amber-200/60">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Unassigned</span>
              <UserX className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{summary.tasksMissingOwners}</div>
            <div className="text-[10px] text-amber-600/80 mt-1">Missing owners</div>
          </Card>
        </Link>

        <Link to="/context-gaps" className="group">
          <Card className="hover:border-red-300 transition-all p-4 bg-red-50/30 border-red-200">
            <div className="flex items-center justify-between text-red-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Critical Gaps</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-700">{summary.criticalContextGaps}</div>
            <div className="text-[10px] text-red-600/80 mt-1">Continuity risks</div>
          </Card>
        </Link>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Context Gap Detector Findings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Context Gap Detector — High Priority Continuities</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Missing deadlines, unassigned responsibilities, unrecorded blocker reasons, and conflicting states.
                </p>
              </div>
              <Link to="/context-gaps">
                <Button variant="ghost" size="sm" className="text-xs text-brand-600">
                  View All Gaps
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary.criticalGaps.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No critical context gaps detected!</p>
                  <p className="text-slate-400 mt-0.5">All tasks and decisions meet continuity requirements.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.criticalGaps.map((gap) => (
                    <div
                      key={gap._id}
                      onClick={() => setSelectedGap(gap)}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-500/50 hover:bg-slate-50/50 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={gap.severity} />
                          <span className="text-[10px] text-slate-500 font-mono">
                            {gap.gapType} ({gap.detectionMethod})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{timeAgo(gap.detectedAt)}</span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-snug">
                        {gap.description}
                      </p>

                      {gap.evidence && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          Evidence: &ldquo;{gap.evidence}&rdquo;
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[11px] text-brand-600 font-medium">
                        <span>Resolution: {gap.recommendedResolution}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Upcoming Milestones & Deadlines</span>
              </CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-brand-600">
                  All Tasks
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary.upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No upcoming deadlines with target dates set.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.upcomingDeadlines.map((task) => (
                    <div key={task._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Owner: {task.owner || 'Unassigned'} • Status: {task.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-slate-800">{formatDate(task.dueDate)}</span>
                        <div className="mt-0.5">
                          <TaskStatusBadge status={task.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Recent Knowledge & Activity */}
        <div className="space-y-6">
          {/* Recently Added Knowledge */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <span>Recent Knowledge</span>
              </CardTitle>
              <Link to="/knowledge">
                <Button variant="ghost" size="sm" className="text-xs text-brand-600">
                  Hub
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary.recentKnowledge.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No sources added yet.</p>
              ) : (
                <div className="space-y-3">
                  {summary.recentKnowledge.map((k) => (
                    <div key={k._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {k.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{timeAgo(k.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                        {k.originalText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Log */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Activity Feed</CardTitle>
              <Link to="/activity">
                <Button variant="ghost" size="sm" className="text-xs text-brand-600">
                  Full Log
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary.recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No activity events recorded.</p>
              ) : (
                <div className="space-y-3">
                  {summary.recentActivity.map((evt) => (
                    <div key={evt._id} className="text-xs border-l-2 border-brand-500 pl-2.5 py-0.5">
                      <p className="font-medium text-slate-800 leading-snug">{evt.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {timeAgo(evt.createdAt)} • {evt.actor || 'System'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ContextGapResolveModal gap={selectedGap} onClose={() => setSelectedGap(null)} />
      <CreateTaskModal isOpen={createTaskOpen} onClose={() => setCreateTaskOpen(false)} />
    </div>
  );
};
