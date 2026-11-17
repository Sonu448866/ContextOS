import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { IKnowledgeSource, KnowledgeSourceType, AIExtractionResult } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
  Check,
  Trash2
} from 'lucide-react';

export const KnowledgeHubPage: React.FC = () => {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<IKnowledgeSource | null>(null);
  const [extractionResult, setExtractionResult] = useState<AIExtractionResult | null>(null);

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      setSyncStatusMsg(`Indexed ${res.totalPointsIndexed} vector chunks across ${res.totalSources} sources into Qdrant Cloud.`);
      refetchQdrant();
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setSyncStatusMsg(`Sync failed: ${err.message}`);
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

  const handleDeleteSource = async (sourceId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      setDeletingId(sourceId);
      await api.delete(`/knowledge/${sourceId}`);
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['qdrant-status'] });
    } catch (err: any) {
      alert(`Failed to delete source: ${err.message}`);
    } finally {
      setDeletingId(null);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Vector Ingestion & Memory
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest, extract, and maintain organizational context across architecture decisions, meeting notes, and updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncQdrant}
            isLoading={isSyncingQdrant}
            className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync to Qdrant</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Knowledge Source</span>
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-mono">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {analysisError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAnalysisError(null)} className="text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="relative grow sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents or text..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
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
              className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                selectedType === type
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading knowledge documents..." className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No knowledge sources found</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Ingest meeting notes, architecture decisions, or project updates to begin vector indexing.
          </p>
          <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)} className="text-xs">
            Add First Source
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((source) => {
            const isAnalyzing = analyzingId === source._id;

            return (
              <Card
                key={source._id}
                className="flex flex-col justify-between hover:border-slate-300 transition-colors p-4 space-y-3 border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {source.sourceType}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{timeAgo(source.createdAt)}</span>
                      {source.extractionStatus === 'Completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Extracted
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{source.title}</h3>

                  {/* Document Excerpt Preview */}
                  <div className="mt-2 p-3 rounded bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap selection:bg-slate-900 selection:text-white">
                    {source.originalText}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-500">
                    {source.author && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <User className="w-3 h-3 text-slate-400" />
                        {source.author}
                      </span>
                    )}

                    {source.tags && source.tags.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{source.tags.map((t) => `#${t}`).join(' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {source._id.substring(source._id.length - 6)}
                    </span>
                    <button
                      onClick={() => handleDeleteSource(source._id, source.title)}
                      disabled={deletingId === source._id}
                      title="Delete knowledge source"
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    variant={source.extractionStatus === 'Completed' ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={isAnalyzing}
                    onClick={() => handleAnalyze(source)}
                    className="text-xs gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
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
