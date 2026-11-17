import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../lib/api';
import { AIQuestionAnswer } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  MessageSquareCode,
  Send,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';

export const AskProjectPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIQuestionAnswer | null>(null);
  const [showChunks, setShowChunks] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestedQuestions = [
    'Why is checkout testing blocked and what is the status of Razorpay?',
    'Who is responsible for the payment integration and what are their open tasks?',
    'What architectural decisions were made regarding payment gateways?',
    'What continuity risks exist if Rahul leaves the project?'
  ];

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || !selectedProjectId) return;

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post<AIQuestionAnswer>(
        `/projects/${selectedProjectId}/ask`,
        { question: q }
      );

      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to generate answer from project knowledge.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAsk();
    }
  };

  const copyToClipboard = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Semantic Vector RAG
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-mono">
            SentenceTransformers + Qdrant Cloud
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareCode className="w-6 h-6 text-indigo-600" />
          <span>Ask Your Project AI</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Queries project documents, ADRs, tasks, and meeting notes using 384-dimensional dense vector embeddings with Groq inference.
        </p>
      </div>

      {/* Query Input Box */}
      <Card className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask any question about blockers, commitments, decisions, or ownership... (e.g. 'Why is checkout testing blocked?')"
              rows={3}
              className="w-full text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 resize-none font-sans"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
              {suggestedQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuestion(sq);
                    handleAsk(sq);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/60 truncate max-w-[280px]"
                  title={sq}
                >
                  {sq}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAsk()}
              isLoading={isLoading}
              disabled={!question.trim()}
              className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white shrink-0 self-end sm:self-auto px-4 py-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Project</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                Ctrl+Enter
              </kbd>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error View */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <LoadingSpinner size="lg" className="mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800">
              Retrieving 384-dimensional vector embeddings from Qdrant Cloud...
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Embedding with SentenceTransformers (all-MiniLM-L6-v2) • Synthesizing with Groq LPU
            </p>
          </div>
        </Card>
      )}

      {/* Synthesized Answer View */}
      {result && (
        <div className="space-y-4">
          {/* RAG Telemetry Bar */}
          {result.vectorSearchMetadata && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                  <span className="font-semibold text-slate-800">Qdrant Cloud RAG</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Retrieved: {result.vectorSearchMetadata.chunksRetrieved} Chunks</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">Top Cosine Match: <strong className="text-indigo-600">{result.vectorSearchMetadata.topScore}%</strong></span>
                </div>
              </div>

              <button
                onClick={() => setShowChunks(!showChunks)}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium self-end sm:self-auto cursor-pointer"
              >
                <span>{showChunks ? 'Hide Vector Chunks' : 'Inspect Retrieved Chunks'}</span>
                {showChunks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Expandable Retrieved Vector Chunks */}
          {showChunks && result.vectorSearchMetadata?.matches && (
            <Card className="border-indigo-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Qdrant Vector Chunks Retrieved ({result.vectorSearchMetadata.matches.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Collection: {result.vectorSearchMetadata.collection}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.vectorSearchMetadata.matches.map((chunk: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 truncate text-[11px]">
                        {chunk.sourceTitle}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {chunk.score}% match
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-mono line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100">
                      &ldquo;{chunk.text}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Author: {chunk.author || 'Team Member'}</span>
                      <span className="font-mono">{chunk.sourceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Answer Content Card */}
          <Card className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Verified Answer</span>
                {result.confidenceScore && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Confidence: {result.confidenceScore}%
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="text-xs gap-1 border-slate-200 hover:bg-slate-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Formatted Markdown Body */}
              <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-800 font-sans">
                {result.answer.split('\n\n').map((paragraph: string, pIdx: number) => (
                  <p key={pIdx} className="leading-relaxed whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Uncertainty Notes */}
              {result.uncertaintyNotes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Continuity / Missing Information Note</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{result.uncertaintyNotes}</p>
                </div>
              )}

              {/* Citations Grid */}
              {result.citations && result.citations.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Grounded Document Citations ({result.citations.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.citations.map((cite: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 truncate">
                            {cite.sourceTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {cite.sourceId.substring(cite.sourceId.length - 6)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic line-clamp-2">
                          &ldquo;{cite.excerpt}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
