import React, { useState } from 'react';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { AIQuestionAnswer } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Quote,
  Lightbulb
} from 'lucide-react';

export const AskProjectPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIQuestionAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    'Why is checkout testing delayed?',
    'What decisions have been made about the payment integration?',
    'Which tasks are blocked and why?',
    'Who is responsible for the webhook verification?',
    'What does the next person need to know before taking over payment work?'
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareCode className="w-6 h-6 text-brand-600" />
          <span>Ask Your Project</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Context research assistant querying stored meeting notes, architecture decisions, task dependencies, and blocker states for{' '}
          <strong className="text-slate-700">{selectedProject?.name || 'Current Project'}</strong>.
        </p>
      </div>

      {/* Query Input Card */}
      <Card className="p-5 space-y-4 shadow-sm border-slate-200">
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
              placeholder="Ask a question (e.g. Why is checkout testing delayed? What was decided about Razorpay?)..."
              className="w-full text-sm bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 pr-24 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              required
            />
            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                disabled={!question.trim() || !selectedProjectId}
                className="gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggested Research Questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(q)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200/80 transition-colors text-left"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card className="p-12 text-center">
          <LoadingSpinner size="lg" label="Retrieving bounded project sources and generating answer..." />
        </Card>
      )}

      {/* Answer Display */}
      {result && (
        <Card className="space-y-6 p-6 border-slate-200 shadow-sm animate-fade-in">
          {/* Answer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Synthesized Project Answer</h3>
            </div>

            {result.confidenceScore && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Evidence Confidence: {(result.confidenceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* Answer Body */}
          <div className="text-sm text-slate-800 leading-relaxed space-y-3 font-sans">
            <p className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
              {result.answer}
            </p>
          </div>

          {/* Uncertainty / Missing Evidence Notes (Section 8.2) */}
          {result.uncertaintyNotes && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Identified Uncertainty & Missing Evidence</span>
              </div>
              <p className="leading-relaxed opacity-90">{result.uncertaintyNotes}</p>
            </div>
          )}

          {/* Detected Conflicts (Section 8.2) */}
          {result.conflictsDetected && result.conflictsDetected.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Contradictions Discovered Between Sources</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {result.conflictsDetected.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Citations & Traceability (Section 8.2) */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>Supporting Source Citations ({result.citations.length})</span>
            </div>

            {result.citations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No direct source excerpts cited.</p>
            ) : (
              <div className="space-y-2.5">
                {result.citations.map((cite, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-blue-50/40 border border-blue-200/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-blue-900">
                      <span>{cite.sourceTitle}</span>
                      <span className="text-[10px] text-blue-600 font-mono">
                        Source ID: {cite.sourceId}
                      </span>
                    </div>
                    {cite.excerpt && (
                      <p className="text-[11px] text-slate-600 italic font-mono leading-relaxed bg-white/70 p-2 rounded border border-blue-100">
                        &ldquo;{cite.excerpt}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
