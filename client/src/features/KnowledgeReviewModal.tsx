import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { AIExtractionResult, IKnowledgeSource } from '../types/shared';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface KnowledgeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: IKnowledgeSource | null;
  extraction: AIExtractionResult | null;
}

export const KnowledgeReviewModal: React.FC<KnowledgeReviewModalProps> = ({
  isOpen,
  onClose,
  source,
  extraction
}) => {
  const queryClient = useQueryClient();

  const [decisions, setDecisions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (extraction) {
      setDecisions(extraction.decisions || []);
      setTasks(extraction.actionItems || []);
    }
  }, [extraction]);

  if (!source || !extraction) return null;

  const handleCommit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      await api.post(`/knowledge/${source._id}/commit`, {
        decisions,
        actionItems: tasks,
        facts: extraction.facts
      });

      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gaps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to commit reviewed extraction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeDecision = (index: number) => {
    setDecisions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & Confirm AI Extracted Knowledge"
      description={`Inspect extracted facts, decisions, and action items from "${source.title}" before committing.`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* AI Summary */}
        <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Executive Summary</span>
          </div>
          <p className="text-xs text-blue-950/80 leading-relaxed">{extraction.summary}</p>
        </div>

        {/* Extracted Decisions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Identified Decisions ({decisions.length})
            </h3>
            <span className="text-[11px] text-slate-400">Will be saved to Decision Records</span>
          </div>

          {decisions.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
              No architectural decisions identified in this document.
            </p>
          ) : (
            <div className="space-y-2.5">
              {decisions.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grow space-y-1">
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => {
                          const updated = [...decisions];
                          updated[idx].title = e.target.value;
                          setDecisions(updated);
                        }}
                        className="w-full text-xs font-semibold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        value={d.content}
                        onChange={(e) => {
                          const updated = [...decisions];
                          updated[idx].content = e.target.value;
                          setDecisions(updated);
                        }}
                        className="w-full text-xs text-slate-600 border border-transparent hover:border-slate-200 focus:border-brand-500 rounded p-1 focus:outline-none"
                      />
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Rationale: </span>
                        <input
                          type="text"
                          value={d.rationale || ''}
                          placeholder="No rationale recorded"
                          onChange={(e) => {
                            const updated = [...decisions];
                            updated[idx].rationale = e.target.value;
                            setDecisions(updated);
                          }}
                          className="w-3/4 text-[11px] text-slate-600 border-b border-dashed border-slate-300 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDecision(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proposed Tasks & Action Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Proposed Tasks & Commitments ({tasks.length})
            </h3>
            <span className="text-[11px] text-slate-400">Will become first-class Task records</span>
          </div>

          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
              No new action items detected in this document.
            </p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => {
                        const updated = [...tasks];
                        updated[idx].title = e.target.value;
                        setTasks(updated);
                      }}
                      className="w-full text-xs font-semibold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeTask(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Owner</span>
                      <input
                        type="text"
                        value={t.owner || ''}
                        placeholder="Unassigned (null)"
                        onChange={(e) => {
                          const updated = [...tasks];
                          updated[idx].owner = e.target.value || null;
                          setTasks(updated);
                        }}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Due Date</span>
                      <input
                        type="date"
                        value={t.dueDate || ''}
                        onChange={(e) => {
                          const updated = [...tasks];
                          updated[idx].dueDate = e.target.value || null;
                          setTasks(updated);
                        }}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Priority</span>
                      <select
                        value={t.priority || 'Medium'}
                        onChange={(e) => {
                          const updated = [...tasks];
                          updated[idx].priority = e.target.value;
                          setTasks(updated);
                        }}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Status</span>
                      <select
                        value={t.status || 'Open'}
                        onChange={(e) => {
                          const updated = [...tasks];
                          updated[idx].status = e.target.value;
                          setTasks(updated);
                        }}
                        className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  {t.status === 'Blocked' && (
                    <div className="pt-1">
                      <span className="text-[10px] text-rose-500 font-semibold block">
                        Blocker Explanation:
                      </span>
                      <input
                        type="text"
                        value={t.blockerDescription || ''}
                        placeholder="Why is this task blocked?"
                        onChange={(e) => {
                          const updated = [...tasks];
                          updated[idx].blockerDescription = e.target.value;
                          setTasks(updated);
                        }}
                        className="w-full text-[11px] bg-rose-50/50 border border-rose-200 rounded px-2 py-1 focus:outline-none text-rose-800"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Identified Blockers & Risks Alert */}
        {((extraction.blockers && extraction.blockers.length > 0) ||
          (extraction.risks && extraction.risks.length > 0)) && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Blockers & Identified Risks</span>
            </div>
            {extraction.blockers?.map((b, i) => (
              <p key={i} className="text-xs text-amber-950/80">
                • <strong>Blocker:</strong> {b.title} — {b.description}
              </p>
            ))}
            {extraction.risks?.map((r, i) => (
              <p key={i} className="text-xs text-amber-950/80">
                • <strong>Risk:</strong> {r.title} — {r.description} ({r.impact || 'Impact unstated'})
              </p>
            ))}
          </div>
        )}

        {/* Footer Confirmation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Source references will link permanently to &ldquo;{source.title}&rdquo;.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCommit} isLoading={isSubmitting}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Commit to Project</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
