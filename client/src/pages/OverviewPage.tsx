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
  ArrowRightLeft,
  MessageSquareCode,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cpu,
  Activity,
  Plus
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
    return <LoadingSpinner size="lg" label="Loading project overview..." className="h-96" />;
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">Unable to load dashboard data. Ensure the ContextOS server and database are running.</span>
        </div>
      </div>
    );
  }

  const { projectHealth } = summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Project Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Workspace
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              ID: <code className="font-mono text-slate-700">{selectedProject?._id || 'global'}</code>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {selectedProject ? selectedProject.name : 'ContextOS Platform Overview'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
            {selectedProject?.description || 'Organizational memory, vector-indexed commitments, and automated handover continuity.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link to="/ask">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700">
              <MessageSquareCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ask Project</span>
            </Button>
          </Link>
          <Link to="/context-transfer">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700">
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Handover</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateTaskOpen(true)}
            className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Platform Quickstart & Continuity Workflow */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 shadow-sm border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Platform Workflow Guide
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              (Live Environment: Continuity Observability & Razorpay Integration)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Follow the 5-step operational flow:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-sans">
          <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-white font-medium flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">1</span>
            <span>Workspace Health</span>
          </div>

          <Link to="/knowledge" className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">2</span>
            <span>Qdrant Vectors</span>
          </Link>

          <Link to="/ask" className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">3</span>
            <span>RAG & Triad Eval</span>
          </Link>

          <Link to="/context-gaps" className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">4</span>
            <span>Gap Detector</span>
          </Link>

          <Link to="/context-transfer" className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">5</span>
            <span>17-Part Handover</span>
          </Link>
        </div>
      </div>

      {/* Project Health Status Card */}
      <div
        className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          projectHealth.status === 'Healthy'
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : projectHealth.status === 'At Risk'
            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
            : 'bg-rose-50/60 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              projectHealth.status === 'Healthy'
                ? 'bg-emerald-100 text-emerald-700'
                : projectHealth.status === 'At Risk'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {projectHealth.status === 'Healthy' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : projectHealth.status === 'At Risk' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <AlertOctagon className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Project Health: {projectHealth.status}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-white/90 border border-current">
                {projectHealth.score}/100
              </span>
            </div>
            <p className="text-xs opacity-90 leading-snug">{projectHealth.summary}</p>
          </div>
        </div>

        <Link to="/context-gaps" className="shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white hover:bg-slate-50 border-current font-medium gap-1"
          >
            <span>Review {summary.criticalContextGaps} Critical Gaps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link to="/projects" className="group block">
          <Card className="h-full p-4 hover:border-slate-300 transition-colors border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Workspaces</span>
              <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">{summary.totalActiveProjects}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Active projects</div>
          </Card>
        </Link>

        <Link to="/knowledge" className="group block">
          <Card className="h-full p-4 hover:border-slate-300 transition-colors border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Knowledge</span>
              <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">{summary.totalKnowledgeSources}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Vectorized sources</div>
          </Card>
        </Link>

        <Link to="/tasks" className="group block">
          <Card className="h-full p-4 hover:border-slate-300 transition-colors border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Open Tasks</span>
              <CheckSquare className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">{summary.openTasks}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Commitments</div>
          </Card>
        </Link>

        <Link to="/tasks?status=Blocked" className="group block">
          <Card className="h-full p-4 hover:border-rose-300 transition-colors bg-rose-50/20 border-rose-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between text-rose-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Blocked</span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 tracking-tight font-sans">{summary.blockedTasks}</div>
            <div className="text-[11px] text-rose-600/90 mt-1 font-medium">Need unblocking</div>
          </Card>
        </Link>

        <Link to="/tasks" className="group block">
          <Card className="h-full p-4 hover:border-amber-300 transition-colors bg-amber-50/20 border-amber-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Unassigned</span>
              <UserX className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 tracking-tight font-sans">{summary.tasksMissingOwners}</div>
            <div className="text-[11px] text-amber-600/90 mt-1 font-medium">Missing owners</div>
          </Card>
        </Link>

        <Link to="/context-gaps" className="group block">
          <Card className="h-full p-4 hover:border-red-300 transition-colors bg-red-50/30 border-red-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between text-red-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600">Critical Gaps</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-700 tracking-tight font-sans">{summary.criticalContextGaps}</div>
            <div className="text-[11px] text-red-600/90 mt-1 font-medium">Continuity risks</div>
          </Card>
        </Link>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Context Gap Detector Findings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Context Gap Detector — High Priority Risks</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Missing owners, unrecorded blockers, conflicting project states, and unconfirmed dates.
                </p>
              </div>
              <Link to="/context-gaps">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  View All Gaps
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {summary.criticalGaps.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No critical context gaps detected</p>
                  <p className="text-slate-400 mt-0.5">All commitments and decisions meet continuity specifications.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.criticalGaps.map((gap) => (
                    <div
                      key={gap._id}
                      onClick={() => setSelectedGap(gap)}
                      className="p-3.5 rounded-lg border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 transition-colors cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={gap.severity} />
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {gap.gapType} • {gap.detectionMethod}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{timeAgo(gap.detectedAt)}</span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-snug">
                        {gap.description}
                      </p>

                      {gap.evidence && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-1">
                          Evidence: &ldquo;{gap.evidence}&rdquo;
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-xs text-indigo-600 font-medium">
                        <span className="truncate pr-2">Resolution: {gap.recommendedResolution}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Milestones */}
          <Card className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Upcoming Milestones & Deadlines</span>
              </CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  All Tasks
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {summary.upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No upcoming deadlines recorded with target dates.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.upcomingDeadlines.map((task) => (
                    <div key={task._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 pr-4">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Owner: <span className="text-slate-700 font-medium">{task.owner || 'Unassigned'}</span> • Status: <span className="font-medium text-slate-700">{task.status}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-slate-800 text-xs">{formatDate(task.dueDate)}</span>
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
          <Card className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>Knowledge Sources</span>
              </CardTitle>
              <Link to="/knowledge">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Hub
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {summary.recentKnowledge.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No sources ingested yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {summary.recentKnowledge.map((k) => (
                    <div key={k._id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {k.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">{timeAgo(k.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {k.originalText}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                        <span className="text-indigo-600 font-medium">384-d Vector</span>
                        <span>{k.sourceType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <span>Audit Activity</span>
              </CardTitle>
              <Link to="/activity">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Full Log
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {summary.recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No activity events recorded.</p>
              ) : (
                <div className="space-y-3">
                  {summary.recentActivity.map((evt) => (
                    <div key={evt._id} className="text-xs border-l-2 border-indigo-600 pl-2.5 py-0.5">
                      <p className="font-medium text-slate-800 leading-snug">{evt.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
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
