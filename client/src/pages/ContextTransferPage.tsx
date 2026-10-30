import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useProject } from '../context/ProjectContext';
import { IContextTransfer, IHandoverPackage } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, formatDateTime, timeAgo } from '../lib/utils';
import { ContextTransferModal } from '../features/ContextTransferModal';
import {
  ArrowRightLeft,
  Printer,
  Sparkles,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';

export const ContextTransferPage: React.FC = () => {
  const { selectedProjectId, selectedProject } = useProject();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');

  const { data: transfers = [], isLoading } = useQuery<IContextTransfer[]>({
    queryKey: ['transfers', selectedProjectId],
    queryFn: () =>
      selectedProjectId
        ? api.get<IContextTransfer[]>(`/projects/${selectedProjectId}/context-transfers`)
        : Promise.resolve([]),
    enabled: !!selectedProjectId
  });

  const activeTransfer =
    transfers.find((t) => t._id === selectedTransferId) || (transfers.length > 0 ? transfers[0] : null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-purple-600" />
            <span>Context Transfer Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export comprehensive 17-part handover packages for project handovers, team departures, or onboarding.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-1.5 self-start sm:self-auto bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Handover</span>
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading context transfers..." className="h-64" />
      ) : transfers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <ArrowRightLeft className="w-10 h-10 text-purple-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No context transfers generated yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
            Generate your first handover package to synthesize all decisions, commitments, blockers, and continuity gaps into an exportable document.
          </p>
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            Generate First Handover
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Handover History List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Handover Packages ({transfers.length})
            </h3>
            <div className="space-y-2">
              {transfers.map((t) => {
                const isSelected = activeTransfer?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTransferId(t._id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1 ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">{t.transferType}</span>
                      <span className="text-[10px] text-slate-400">{timeAgo(t.createdAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {t.outgoingOwner && <span>From: {t.outgoingOwner} ➔ </span>}
                      {t.incomingOwner && <span>To: {t.incomingOwner}</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1">
                      {formatDateTime(t.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Handover Document View (Print Friendly) */}
          <div className="lg:col-span-3 space-y-4">
            {activeTransfer && (
              <Card className="border-slate-200/80 shadow-sm print:shadow-none print:border-none">
                {/* Document Top Bar */}
                <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {activeTransfer.transferType} Package
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      Generated {formatDateTime(activeTransfer.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => setViewMode('structured')}
                        className={`px-2.5 py-1 rounded font-medium transition-colors ${
                          viewMode === 'structured' ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                      >
                        Structured View
                      </button>
                      <button
                        onClick={() => setViewMode('markdown')}
                        className={`px-2.5 py-1 rounded font-medium transition-colors ${
                          viewMode === 'markdown' ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                      >
                        Markdown
                      </button>
                    </div>

                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print to PDF</span>
                    </Button>
                  </div>
                </div>

                {/* Handover Body */}
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {viewMode === 'markdown' ? (
                    <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {activeTransfer.generatedContent.rawMarkdown}
                    </pre>
                  ) : (
                    <div className="space-y-6 text-slate-800">
                      {/* Document Title Header */}
                      <div className="pb-5 border-b border-slate-200">
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full inline-block mb-2">
                          17-Part Context Handover Package
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                          Project Context Handover: {selectedProject?.name || 'Project'}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                          <span><strong>Transfer Type:</strong> {activeTransfer.transferType}</span>
                          {activeTransfer.outgoingOwner && (
                            <span><strong>Outgoing Owner:</strong> {activeTransfer.outgoingOwner}</span>
                          )}
                          {activeTransfer.incomingOwner && (
                            <span><strong>Incoming Owner:</strong> {activeTransfer.incomingOwner}</span>
                          )}
                          {activeTransfer.period && (
                            <span><strong>Period:</strong> {activeTransfer.period}</span>
                          )}
                        </div>
                      </div>

                      {/* 1. Executive Summary */}
                      <section className="space-y-1.5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">1</span>
                          <span>Executive Summary</span>
                        </h3>
                        <p className="text-xs text-slate-700 leading-relaxed p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          {activeTransfer.generatedContent.executiveSummary}
                        </p>
                      </section>

                      {/* 2 & 3. Background & Current State */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <section className="space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold">2</span>
                            <span>Project Background</span>
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {activeTransfer.generatedContent.projectBackground}
                          </p>
                        </section>

                        <section className="space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold">3</span>
                            <span>Current Project State</span>
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {activeTransfer.generatedContent.currentProjectState}
                          </p>
                        </section>
                      </div>

                      {/* 4 & 5. Important Decisions and Rationale */}
                      <section className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                          <span>Decisions & Underlying Rationale</span>
                        </h3>
                        <div className="space-y-2">
                          {activeTransfer.generatedContent.importantDecisions.map((d, i) => (
                            <div key={i} className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl text-xs space-y-1">
                              <span className="font-bold text-blue-950 block">{d.title}</span>
                              <p className="text-slate-700 leading-relaxed">{d.content}</p>
                              {d.rationale && (
                                <p className="text-[11px] text-blue-800 font-medium">
                                  <strong>Rationale:</strong> {d.rationale}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 7 & 8. Open Tasks & Owners/Deadlines */}
                      <section className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">7</span>
                          <span>Open Tasks & Commitments</span>
                        </h3>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {activeTransfer.generatedContent.openTasks.map((t, i) => (
                            <div key={i} className="p-3 bg-white flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-slate-900">{t.title}</span>
                                <span className="text-[11px] text-slate-500 block">
                                  Owner: {t.owner || 'Unassigned'} • Status: {t.status} • Priority: {t.priority}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-slate-600">
                                {t.dueDate ? formatDate(t.dueDate) : 'No deadline'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 9 & 10. Blockers & Dependencies */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <section className="space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">9</span>
                            <span>Blockers</span>
                          </h3>
                          <div className="space-y-1.5">
                            {activeTransfer.generatedContent.blockers.map((b, i) => (
                              <div key={i} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs">
                                <span className="font-bold text-rose-900 block">{b.title}</span>
                                <p className="text-rose-800 text-[11px]">{b.description}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold">10</span>
                            <span>Dependencies</span>
                          </h3>
                          <div className="space-y-1.5">
                            {activeTransfer.generatedContent.dependencies.map((dep, i) => (
                              <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                <span className="font-semibold text-slate-800">{dep.dependent}</span>
                                <span className="text-[11px] text-slate-500 block">
                                  ➔ Depends on: <strong>{dep.dependsOn}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      {/* 15 & 16. Next Steps and Missing/Conflicting Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <section className="space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">15</span>
                            <span>Recommended Next Steps</span>
                          </h3>
                          <ul className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1 list-decimal list-inside text-emerald-950 font-medium">
                            {activeTransfer.generatedContent.recommendedNextSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </section>

                        <section className="space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">16</span>
                            <span>Missing / Conflicting Info</span>
                          </h3>
                          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950">
                            {activeTransfer.generatedContent.missingOrConflictingInformation.map((item, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      {/* 17. Source References */}
                      <section className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          17. Underlying Document References
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {activeTransfer.generatedContent.sourceReferences.map((ref, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                              [Source {ref.sourceId}] {ref.title}
                            </span>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <ContextTransferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(id) => setSelectedTransferId(id)}
      />
    </div>
  );
};
