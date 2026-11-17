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
  ArrowRight
} from 'lucide-react';

export const ContextGapDetectorPage: React.FC = () => {
  const { selectedProjectId } = useProject();
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Continuity Safeguard
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Context Gap & Contradiction Detector</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Combines deterministic validation rules with Groq LPU cross-document contradiction checks.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunAnalysis}
          isLoading={isAnalyzing}
          className="gap-1.5 self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white text-xs px-3.5 py-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Run Gap Analysis</span>
        </Button>
      </div>

      {/* Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <span className="font-bold text-slate-900 block text-xs">⚡ Deterministic Rule Engine</span>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Flags unassigned responsibilities, unrecorded blocker reasons, expired deadlines, and decisions missing documented rationales.
          </p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <span className="font-bold text-slate-900 block text-xs">🧠 Groq Cross-Document Contradiction Analyzer</span>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Cross-checks conflicting statements between documents (e.g. document claiming feature is done vs. testing update reporting it blocked).
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'Open', 'Acknowledged', 'Resolved', 'Dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
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
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 focus:outline-none font-medium text-slate-700"
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
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No context gaps found</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            All tasks have confirmed owners, deadlines, rationale, and no contradictory statements were detected.
          </p>
          <Button variant="outline" size="sm" onClick={handleRunAnalysis} className="text-xs">
            Run Analysis Again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => (
            <Card
              key={gap._id}
              onClick={() => setSelectedGap(gap)}
              className="p-4 hover:border-slate-300 transition-colors cursor-pointer space-y-3 border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={gap.severity} />
                  <GapStatusBadge status={gap.status} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {gap.gapType} ({gap.detectionMethod})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Detected {timeAgo(gap.detectedAt)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{gap.description}</h3>

                {gap.evidence && (
                  <p className="text-xs text-slate-600 italic mt-1.5 font-mono bg-slate-50 p-2.5 rounded border border-slate-200/80">
                    Evidence: &ldquo;{gap.evidence}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium flex items-center justify-between gap-2">
                <span>
                  <strong>Recommended:</strong> {gap.recommendedResolution}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-700">
                  <span>View Details & Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>

                <div className="flex items-center gap-2">
                  {gap.status === 'Open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleQuickResolve(e, gap._id, 'Acknowledged')}
                      className="text-xs gap-1 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
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
                      className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
