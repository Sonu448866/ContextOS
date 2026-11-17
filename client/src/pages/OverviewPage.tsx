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
  CheckCircle2,
  Database,
  Cpu,
  Activity,
  Layers,
  TrendingUp
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
      <div className="p-8 bg-rose-50/80 border border-rose-200/80 text-rose-800 rounded-2xl text-sm shadow-sm">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          <span className="font-semibold">Failed to load dashboard metrics. Ensure MongoDB and ContextOS server are running.</span>
        </div>
      </div>
    );
  }

  const { projectHealth } = summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Hero Welcome & Quick Launch */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-8 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Database className="w-3 h-3 text-indigo-400" />
                Qdrant Cloud RAG Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Cpu className="w-3 h-3 text-emerald-400" />
                Groq LPU Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {selectedProject ? selectedProject.name : 'ContextOS Intelligence Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time organizational context, vector-indexed memory, semantic gap tracking, and automated 17-part handover orchestration.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link to="/ask">
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border-0 text-xs gap-1.5 py-2 px-3.5"
              >
                <MessageSquareCode className="w-4 h-4" />
                <span>Ask Project AI</span>
              </Button>
            </Link>
            <Link to="/context-transfer">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 py-2 px-3.5"
              >
                <ArrowRightLeft className="w-4 h-4 text-purple-300" />
                <span>Export Handover</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateTaskOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 py-2 px-3.5"
            >
              <CheckSquare className="w-4 h-4 text-emerald-300" />
              <span>New Task</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Project Health Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
          projectHealth.status === 'Healthy'
            ? 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-white border-emerald-200/80 text-emerald-950'
            : projectHealth.status === 'At Risk'
            ? 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-amber-200/80 text-amber-950'
            : 'bg-gradient-to-r from-rose-50/90 via-rose-50/50 to-white border-rose-200/80 text-rose-950'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                projectHealth.status === 'Healthy'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                  : projectHealth.status === 'At Risk'
                  ? 'bg-amber-500 text-white shadow-amber-500/25'
                  : 'bg-rose-500 text-white shadow-rose-500/25'
              }`}
            >
              {projectHealth.status === 'Healthy' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : projectHealth.status === 'At Risk' ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <AlertOctagon className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-bold tracking-tight">Project Health: {projectHealth.status}</span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/90 shadow-xs border border-current">
                  Score: {projectHealth.score}/100
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-90 font-medium leading-relaxed max-w-3xl">
                {projectHealth.summary}
              </p>
            </div>
          </div>

          <Link to="/context-gaps" className="shrink-0 self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white hover:bg-slate-50 border-slate-300 font-semibold shadow-xs gap-1.5 py-2 px-3.5"
            >
              <span>Review {summary.criticalContextGaps} Critical Gaps</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Active Projects */}
        <Link to="/projects" className="group block">
          <Card className="h-full p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Workspaces
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.totalActiveProjects}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>Active workspaces</span>
            </div>
          </Card>
        </Link>

        {/* Knowledge Sources */}
        <Link to="/knowledge" className="group block">
          <Card className="h-full p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Sources
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.totalKnowledgeSources}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>Qdrant indexed</span>
            </div>
          </Card>
        </Link>

        {/* Open Tasks */}
        <Link to="/tasks" className="group block">
          <Card className="h-full p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Open Tasks
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.openTasks}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>In progress & todo</span>
            </div>
          </Card>
        </Link>

        {/* Blocked Tasks */}
        <Link to="/tasks?status=Blocked" className="group block">
          <Card className="h-full p-4 hover:shadow-md transition-all duration-200 bg-rose-50/30 border-rose-200/80">
            <div className="flex items-center justify-between text-rose-500 mb-2">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Blocked</span>
              <div className="w-7 h-7 rounded-lg bg-rose-100/80 flex items-center justify-center text-rose-700">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight">{summary.blockedTasks}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-1">Requiring unblocking</div>
          </Card>
        </Link>

        {/* Missing Owners */}
        <Link to="/tasks" className="group block">
          <Card className="h-full p-4 hover:shadow-md transition-all duration-200 bg-amber-50/30 border-amber-200/80">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Unassigned</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-700 tracking-tight">{summary.tasksMissingOwners}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">Missing owners</div>
          </Card>
        </Link>

        {/* Critical Gaps */}
        <Link to="/context-gaps" className="group block">
          <Card className="h-full p-4 hover:shadow-md transition-all duration-200 bg-red-50/40 border-red-200">
            <div className="flex items-center justify-between text-red-600 mb-2">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Critical</span>
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-red-700 tracking-tight">{summary.criticalContextGaps}</div>
            <div className="text-[10px] text-red-600 font-medium mt-1">Continuity risks</div>
          </Card>
        </Link>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Context Gap Detector Findings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Context Gap Detector — High Priority Continuities</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated deterministic rules and AI cross-verification of conflicting states.
                </p>
              </div>
              <Link to="/context-gaps">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
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
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/30 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer space-y-2 group shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={gap.severity} />
                          <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                            {gap.gapType} • {gap.detectionMethod}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{timeAgo(gap.detectedAt)}</span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                        {gap.description}
                      </p>

                      {gap.evidence && (
                        <p className="text-[11px] text-slate-500 italic bg-white/80 p-2 rounded border border-slate-200/60 line-clamp-2">
                          Evidence: &ldquo;{gap.evidence}&rdquo;
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:text-indigo-700">
                        <span className="truncate pr-2">Recommended: {gap.recommendedResolution}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Upcoming Milestones & Deadlines</span>
              </CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                  <span>All Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {summary.upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No upcoming deadlines with target dates set.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.upcomingDeadlines.map((task) => (
                    <div key={task._id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm">{task.title}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Owner: <strong className="text-slate-700">{task.owner || 'Unassigned'}</strong></span>
                          <span>•</span>
                          <span>Priority: <strong className="text-slate-700">{task.priority}</strong></span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800 text-xs">{formatDate(task.dueDate)}</span>
                        <div className="mt-1">
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

        {/* Right Column (1 col): Recent Knowledge & Activity */}
        <div className="space-y-6">
          {/* Recently Added Knowledge */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Vector Knowledge Hub</span>
              </CardTitle>
              <Link to="/knowledge">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                  Hub
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {summary.recentKnowledge.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No sources added yet.</p>
              ) : (
                <div className="space-y-3">
                  {summary.recentKnowledge.map((k) => (
                    <div key={k._id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1.5 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {k.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">{timeAgo(k.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {k.originalText}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                          <Database className="w-2.5 h-2.5" />
                          384-d Cosine Vector
                        </span>
                        <span>{k.sourceType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Log */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Audit Feed</span>
              </CardTitle>
              <Link to="/activity">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
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
                    <div key={evt._id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1 bg-slate-50/40 rounded-r-lg">
                      <p className="font-medium text-slate-800 leading-snug">{evt.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{timeAgo(evt.createdAt)}</span>
                        <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">{evt.actor || 'System'}</span>
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
