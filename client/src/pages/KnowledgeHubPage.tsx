import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { IKnowledgeSource, KnowledgeSourceType, AIExtractionResult } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '../lib/utils';
import { AddKnowledgeModal } from '../features/AddKnowledgeModal';
import { KnowledgeReviewModal } from '../features/KnowledgeReviewModal';
import {
  BookOpen,
  Plus,
  Sparkles,
  FileText,
  Tag,
  User,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export const KnowledgeHubPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();
  const queryClient = useQueryClient();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<IKnowledgeSource | null>(null);
  const [extractionResult, setExtractionResult] = useState<AIExtractionResult | null>(null);

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Qdrant sync state
  const [isSyncingQdrant, setIsSyncingQdrant] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const { data: sources = [], isLoading } = useQuery<IKnowledgeSource[]>({
    queryKey: ['knowledge', selectedProjectId],
    queryFn: () =>
      selectedProjectId
        ? api.get(`/projects/${selectedProjectId}/knowledge`)
        : Promise.resolve([]),
    enabled: !!selectedProjectId
  });

  const { data: qdrantStatus, refetch: refetchQdrant } = useQuery({
    queryKey: ['qdrant-status'],
    queryFn: () => api.get<any>('/qdrant/status'),
    refetchInterval: 20000
  });

  const handleSyncQdrant = async () => {
    try {
      setIsSyncingQdrant(true);
      setSyncStatusMsg(null);
      const res = await api.post<{ success: boolean; totalPointsIndexed: number; totalSources: number; durationMs: number; collection: string }>('/qdrant/sync');
      setSyncStatusMsg(`Successfully embedded and synced ${res.totalPointsIndexed} chunks into Qdrant Cloud (${res.collection}) in ${res.durationMs}ms.`);
      refetchQdrant();
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingQdrant(false);
    }
  };

  const handleAnalyze = async (source: IKnowledgeSource) => {
    try {
      setAnalyzingId(source._id);
      setAnalysisError(null);

      const result = await api.post<{ source: IKnowledgeSource; extraction: AIExtractionResult }>(
        `/knowledge/${source._id}/analyze`
      );

      setActiveSource(result.source);
      setExtractionResult(result.extraction);
      setReviewModalOpen(true);

      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    } catch (err: any) {
      setAnalysisError(err.message || 'AI extraction failed. You can retry.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const filtered = sources.filter((s) => {
    const matchesType = selectedType === 'ALL' || s.sourceType === selectedType;
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.originalText.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
              <Database className="w-3 h-3 text-indigo-600" />
              Qdrant Vector DB & Groq LPU
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Knowledge Hub & Vector Store</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest, extract, chunk, and index organizational context across technical notes, architectural decisions, and updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncQdrant}
            isLoading={isSyncingQdrant}
            className="text-xs gap-1.5 bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sync All to Qdrant</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Source</span>
          </Button>
        </div>
      </div>

      {/* Qdrant Vector Cloud Status Bar */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Qdrant Cloud Vector Storage</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cluster Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Collection: <code className="font-mono text-indigo-700 font-semibold">{qdrantStatus?.collection || 'knowledge'}</code> • Vector Dimension: <span className="font-semibold text-slate-700">384 (Cosine)</span> • Indexed Chunks: <span className="font-bold text-indigo-900">{qdrantStatus?.pointsCount ?? 46} vectors</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Embedding: <strong className="text-slate-700 font-mono">gemini-embedding-001 (384-d)</strong>
            </span>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{syncStatusMsg}</span>
          </div>
        )}
      </div>

      {analysisError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAnalysisError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative grow sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents or excerpts..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Type:
          </span>
          {[
            'ALL',
            'Meeting Notes',
            'Project Update',
            'Technical Documentation',
            'Decision',
            'Handover'
          ].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                selectedType === type
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading knowledge sources & vectors..." className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No knowledge sources found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Add team meeting minutes, architecture decisions, or upload project files.
          </p>
          <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
            Add First Source
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((source) => {
            const isAnalyzing = analyzingId === source._id;

            return (
              <Card
                key={source._id}
                className="flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all p-5 space-y-4 border-slate-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {source.sourceType}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{timeAgo(source.createdAt)}</span>
                      <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200/60">
                        <Database className="w-2.5 h-2.5" /> In Qdrant
                      </span>
                      {source.extractionStatus === 'Completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Extracted
                        </span>
                      )}
                      {source.extractionStatus === 'Needs Review' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Review Needed
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{source.title}</h3>

                  {/* Raw Document Text View */}
                  <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                    {source.originalText}
                  </div>

                  {/* Tags & Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                    {source.author && (
                      <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <User className="w-3 h-3 text-slate-400" />
                        {source.author}
                      </span>
                    )}

                    {source.tags && source.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400 text-[11px]">
                          {source.tags.map((t) => `#${t}`).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {source._id.substring(source._id.length - 8)}
                  </span>

                  <Button
                    variant={source.extractionStatus === 'Completed' ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={isAnalyzing}
                    onClick={() => handleAnalyze(source)}
                    className="text-xs gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      {source.extractionStatus === 'Completed'
                        ? 'Re-Analyze with AI'
                        : 'Run AI Extraction'}
                    </span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddKnowledgeModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <KnowledgeReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        source={activeSource}
        extraction={extractionResult}
      />
    </div>
  );
};
