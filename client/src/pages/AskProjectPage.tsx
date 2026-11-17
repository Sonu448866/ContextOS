import React, { useState } from 'react';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { AIQuestionAnswer } from '../types/shared';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  MessageSquareCode,
  Sparkles,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Lightbulb,
  Copy,
  Check,
  Database,
  Cpu,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AskProjectPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIQuestionAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showVectorChunks, setShowVectorChunks] = useState(false);

  const suggestedQuestions = [
    'Why is checkout testing delayed?',
    'What decisions have been made about the payment integration?',
    'Which tasks are blocked and what are their dependencies?',
    'Who is responsible for the webhook verification?',
    'What does an incoming engineer need to know before taking over payments?'
  ];

  const handleAsk = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim() || !selectedProjectId) return;

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const data = await api.post<AIQuestionAnswer>(`/projects/${selectedProjectId}/ask`, {
        question: query.trim()
      });

      setResult(data);
      if (qText) setQuestion(qText);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve project answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B0F19] via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/0 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Semantic RAG Engine</span>
              <span className="text-slate-400">•</span>
              <span className="text-cyan-300">Qdrant Cloud + Groq LPU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              Ask Your Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Query architecture decisions, unwritten context, meeting updates, and blocked tasks for{' '}
              <strong className="text-white underline decoration-indigo-400/50 underline-offset-4">
                {selectedProject?.name || 'Current Project'}
              </strong>.
            </p>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-cyan-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Qdrant 384-Dim RAG</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-indigo-300">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Groq GPT-OSS-20B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Query Input Card */}
      <Card className="p-5 sm:p-6 space-y-4 shadow-sm border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this project (e.g. Why is checkout testing blocked? What was decided about Razorpay?)..."
              className="w-full text-sm bg-slate-50/80 border border-slate-200 rounded-xl p-4 pr-32 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all resize-none font-sans"
              required
            />
            <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono bg-slate-200/60 px-1.5 py-0.5 rounded">
                Ctrl + ↵
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                disabled={!question.trim() || !selectedProjectId}
                className="gap-1.5 bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-700 hover:to-brand-700 shadow-md shadow-indigo-500/20 text-white font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Search RAG</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended Research Prompts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(q)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 border border-slate-200/80 transition-all text-left shadow-2xs font-medium"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card className="p-12 text-center border-slate-200 bg-white/80">
          <LoadingSpinner size="lg" label="Searching Qdrant vector space & synthesizing grounded answer via Groq LPU..." />
        </Card>
      )}

      {/* Answer Display */}
      {result && (
        <div className="space-y-4">
          {/* RAG Vector Retrieval Status Banner */}
          {result.vectorSearchMetadata && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50/80 via-indigo-50/40 to-slate-50 border border-cyan-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-sm">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-sans">
                      Qdrant Semantic Vector Retrieval
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Top Match: {result.vectorSearchMetadata.topScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Retrieved{' '}
                    <strong className="text-slate-900 font-semibold">
                      {result.vectorSearchMetadata.chunksRetrieved} semantic chunks
                    </strong>{' '}
                    from collection <code className="font-mono text-cyan-800 bg-cyan-100/60 px-1 py-0.5 rounded text-[10px]">{result.vectorSearchMetadata.collection}</code> in{' '}
                    <span className="font-mono font-medium">{result.vectorSearchMetadata.queryLatencyMs}ms</span>.
                  </p>
                </div>
              </div>

              {result.vectorSearchMetadata.matches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowVectorChunks(!showVectorChunks)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-800 hover:text-cyan-900 bg-white/80 px-3 py-1.5 rounded-lg border border-cyan-200 hover:bg-white transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{showVectorChunks ? 'Hide Chunks' : 'Inspect Vector Chunks'}</span>
                  {showVectorChunks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}

          {/* Expandable Qdrant Chunks Accordion */}
          {showVectorChunks && result.vectorSearchMetadata && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-100/70 rounded-xl border border-slate-200">
              {result.vectorSearchMetadata.matches.map((chunk, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 truncate max-w-[200px]">{chunk.sourceTitle}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Similarity: {chunk.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed font-sans bg-slate-50 p-2 rounded border border-slate-100">
                    &ldquo;{chunk.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Type: {chunk.sourceType}</span>
                    <span>Author: {chunk.author || 'Team'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answer Card */}
          <Card className="space-y-6 p-6 sm:p-7 border-slate-200 shadow-sm bg-white">
            {/* Answer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-brand-500 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Grounded Project Synthesis
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">Engine: Groq LPU (GPT-OSS-20B)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {result.confidenceScore && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Confidence: {(result.confidenceScore * 100).toFixed(0)}%
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs gap-1.5 h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Answer Body */}
            <div className="text-sm text-slate-800 leading-relaxed font-sans">
              <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 whitespace-pre-wrap leading-relaxed shadow-2xs font-sans text-slate-900">
                {result.answer}
              </div>
            </div>

            {/* Uncertainty / Missing Evidence Notes */}
            {result.uncertaintyNotes && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Identified Uncertainty & Missing Evidence</span>
                </div>
                <p className="leading-relaxed opacity-90">{result.uncertaintyNotes}</p>
              </div>
            )}

            {/* Detected Conflicts */}
            {result.conflictsDetected && result.conflictsDetected.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Contradictions Discovered Across Sources</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {result.conflictsDetected.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations & Traceability */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Supporting Source Citations ({result.citations.length})</span>
              </div>

              {result.citations.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No direct source excerpts cited.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {result.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs space-y-1.5 hover:border-indigo-200 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          {cite.sourceTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {cite.sourceId}
                        </span>
                      </div>
                      {cite.excerpt && (
                        <p className="text-[11px] text-slate-700 italic font-mono leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                          &ldquo;{cite.excerpt}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
