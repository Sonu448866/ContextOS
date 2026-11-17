import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { IContextGap, GapSeverity, GapStatus } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SeverityBadge, GapStatusBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, formatDateTime, timeAgo } from '../lib/utils';
import { ContextGapResolveModal } from '../features/ContextGapResolveModal';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  FileText,
  Filter,
  Check,
  Eye,
  Ban,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';

export const ContextGapDetectorPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();
  const queryClient = useQueryClient();

  const [selectedGap, setSelectedGap] = useState<IContextGap | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: gaps = [], isLoading } = useQuery<IContextGap[]>({
    queryKey: ['gaps', selectedProjectId, statusFilter, severityFilter],
    queryFn: () =>
      selectedProjectId
        ? api.get<IContextGap[]>(`/projects/${selectedProjectId}/context-gaps`, {
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            severity: severityFilter === 'ALL' ? undefined : severityFilter
          })
        : Promise.resolve([]),
    enabled: !!selectedProjectId
  });

  const handleRunAnalysis = async () => {
    if (!selectedProjectId) return;
    try {
      setIsAnalyzing(true);
      await api.post(`/projects/${selectedProjectId}/context-gaps/analyze`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gaps'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] })
      ]);
    } catch (err) {
      console.error('Failed to analyze gaps:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickResolve = async (e: React.MouseEvent, gapId: string, status: GapStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/context-gaps/${gapId}`, { status });
      queryClient.invalidateQueries({ queryKey: ['gaps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    } catch (err) {
      console.error('Failed to update gap status:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Continuity Safeguard
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Context Gap & Contradiction Detector</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rule validation and Groq LPU cross-document contradiction detection.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunAnalysis}
          isLoading={isAnalyzing}
          className="gap-2 self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Run Gap Analysis</span>
        </Button>
      </div>

      {/* Information Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <p className="text-xs font-bold text-slate-800">
          How ContextOS detects missing information and continuity risks:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-white border border-slate-200/70">
            <span className="font-bold text-indigo-700 block mb-1">⚡ Deterministic Rule Engine</span>
            Flags unassigned responsibilities, unrecorded blocker reasons, expired deadlines, and decisions missing documented rationales.
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200/70">
            <span className="font-bold text-purple-700 block mb-1">🧠 Groq LPU Contradiction Cross-Checker</span>
            Cross-compares claims between documents (e.g. document claiming feature is done vs. testing note reporting it blocked).
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'Open', 'Acknowledged', 'Resolved', 'Dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[11px] font-medium px-3 py-1 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none font-medium text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Gaps List */}
      {isLoading ? (
        <LoadingSpinner label="Auditing project continuity..." className="h-64" />
      ) : gaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No context gaps found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            All tasks have confirmed owners, deadlines, rationale, and no contradictory statements were detected.
          </p>
          <Button variant="outline" size="sm" onClick={handleRunAnalysis}>
            Run Analysis Again
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {gaps.map((gap) => (
            <Card
              key={gap._id}
              onClick={() => setSelectedGap(gap)}
              className="p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-3.5 border-slate-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={gap.severity} />
                  <GapStatusBadge status={gap.status} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {gap.gapType} ({gap.detectionMethod})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Detected {timeAgo(gap.detectedAt)}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{gap.description}</h3>

                {gap.evidence && (
                  <p className="text-xs text-slate-600 italic mt-2 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Evidence: &ldquo;{gap.evidence}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 font-medium flex items-center justify-between gap-2">
                <span>
                  <strong className="text-indigo-900">Recommended Resolution:</strong> {gap.recommendedResolution}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700">
                  <span>View Details & Resolution Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>

                <div className="flex items-center gap-2">
                  {gap.status === 'Open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleQuickResolve(e, gap._id, 'Acknowledged')}
                      className="text-xs gap-1 bg-white hover:bg-slate-50 border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>Acknowledge</span>
                    </Button>
                  )}

                  {gap.status !== 'Resolved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleQuickResolve(e, gap._id, 'Resolved')}
                      className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <ContextGapResolveModal gap={selectedGap} onClose={() => setSelectedGap(null)} />
    </div>
  );
};
