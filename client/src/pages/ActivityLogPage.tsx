import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { IActivityEvent } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDateTime, timeAgo } from '../lib/utils';
import {
  Activity,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  RefreshCw,
  Search
} from 'lucide-react';

export const ActivityLogPage: React.FC = () => {
  const { selectedProjectId } = useProject();

  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [scopeAllProjects, setScopeAllProjects] = useState(false);

  const { data, isLoading, refetch } = useQuery<{
    events: IActivityEvent[];
    total: number;
    limit: number;
    skip: number;
  }>({
    queryKey: ['activity', selectedProjectId, eventTypeFilter, outcomeFilter, scopeAllProjects],
    queryFn: () =>
      api.get('/activity', {
        projectId: scopeAllProjects ? undefined : selectedProjectId || undefined,
        eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
        outcome: outcomeFilter === 'ALL' ? undefined : outcomeFilter,
        limit: 100
      }),
    refetchInterval: 15000
  });

  const events = data?.events || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-600" />
            <span>Activity Log & Observability</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database-backed audit trail of all business events, AI extractions, task transitions, and context transfers with request ID correlation.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 self-start sm:self-auto text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Events</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Scope Toggle */}
          <button
            onClick={() => setScopeAllProjects((prev) => !prev)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              scopeAllProjects
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {scopeAllProjects ? 'Scope: All Projects' : 'Scope: Active Project'}
          </button>

          {/* Event Type Filter */}
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="ProjectCreated">ProjectCreated</option>
            <option value="KnowledgeAdded">KnowledgeAdded</option>
            <option value="AIExtractionStarted">AIExtractionStarted</option>
            <option value="AIExtractionCompleted">AIExtractionCompleted</option>
            <option value="TaskCreated">TaskCreated</option>
            <option value="TaskStatusChanged">TaskStatusChanged</option>
            <option value="TaskCarriedForward">TaskCarriedForward</option>
            <option value="ContextTransferGenerated">ContextTransferGenerated</option>
            <option value="ContextGapDetected">ContextGapDetected</option>
            <option value="ContextGapResolved">ContextGapResolved</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Outcomes</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
            <option value="Warning">Warning</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Total Logged: {data?.total || 0}
        </span>
      </div>

      {/* Events Stream */}
      {isLoading ? (
        <LoadingSpinner label="Fetching persistent audit events..." className="h-64" />
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No events found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Perform actions such as adding knowledge, creating tasks, or generating handovers to see logged audit entries.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {events.map((evt) => (
            <div key={evt._id} className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 grow">
                <div className="mt-0.5">
                  {evt.outcome === 'Success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : evt.outcome === 'Warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>

                <div className="space-y-1 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{evt.eventType}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {evt.entityType}
                    </span>
                    <span className="text-[10px] text-slate-400">By {evt.actor || 'System User'}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-snug">{evt.message}</p>

                  {evt.requestId && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <FileCode className="w-3 h-3 text-slate-400" />
                      <span>Correlation ID: {evt.requestId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-medium text-slate-600 block">{timeAgo(evt.createdAt)}</span>
                <span className="text-[10px] text-slate-400 block">{formatDateTime(evt.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
