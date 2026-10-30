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
  Filter
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

  const { data: sources = [], isLoading } = useQuery<IKnowledgeSource[]>({
    queryKey: ['knowledge', selectedProjectId],
    queryFn: () =>
      selectedProjectId
        ? api.get(`/projects/${selectedProjectId}/knowledge`)
        : Promise.resolve([]),
    enabled: !!selectedProjectId
  });

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingest, extract, and maintain organizational memory across meeting notes, technical docs, and updates.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Source</span>
        </Button>
      </div>

      {analysisError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center justify-between">
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
        <div className="relative grow sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents or excerpts..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
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
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
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

      {/* Content Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading knowledge sources..." className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
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
                className="flex flex-col justify-between hover:border-slate-300 transition-all p-5 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full">
                      {source.sourceType}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{timeAgo(source.createdAt)}</span>
                      {source.extractionStatus === 'Completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Extracted
                        </span>
                      )}
                      {source.extractionStatus === 'Needs Review' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Review Needed
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{source.title}</h3>

                  {/* Raw Document Text View */}
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap selection:bg-brand-500 selection:text-white">
                    {source.originalText}
                  </div>

                  {/* Tags & Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                    {source.author && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <User className="w-3 h-3 text-slate-400" />
                        {source.author}
                      </span>
                    )}

                    {source.tags && source.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400">
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
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
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
