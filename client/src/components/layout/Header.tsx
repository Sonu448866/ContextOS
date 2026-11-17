import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import {
  Menu,
  Database,
  Bot,
  Sparkles,
  PlusCircle,
  FolderKanban,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../../lib/api';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenAddKnowledge: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenAddKnowledge }) => {
  const { projects, selectedProjectId, selectedProject, setSelectedProjectId, refreshProjects, isLoading } = useProject();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [isSyncingQdrant, setIsSyncingQdrant] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      await api.post('/seed', { force: true });
      await refreshProjects();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to seed demo:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncQdrant = async () => {
    try {
      setIsSyncingQdrant(true);
      await api.post('/qdrant/sync', { projectId: selectedProjectId || undefined });
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to sync Qdrant:', err);
    } finally {
      setIsSyncingQdrant(false);
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Project Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Project Switcher */}
        <div className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <FolderKanban className="w-4 h-4 text-indigo-600 hidden sm:block" />
          <span className="text-xs font-semibold text-slate-500 hidden sm:block">Project:</span>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 max-w-[200px] sm:max-w-[260px] truncate cursor-pointer"
          >
            {isLoading && projects.length === 0 ? (
              <option value="">Loading projects...</option>
            ) : projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.status})
                </option>
              ))
            )}
          </select>
          {selectedProject && (
            <span className="hidden md:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Right: Status Pills & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Qdrant RAG Pill */}
        <button
          onClick={handleSyncQdrant}
          disabled={isSyncingQdrant}
          title="Click to re-sync knowledge vectors to Qdrant Cloud"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50/70 border border-cyan-200/80 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100/70 transition-all cursor-pointer shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-cyan-600" />
          <span>{syncSuccess ? 'Synced to Qdrant!' : isSyncingQdrant ? 'Vectorizing...' : 'Qdrant RAG'}</span>
          <RefreshCw className={cn('w-3 h-3 text-cyan-600 ml-0.5', isSyncingQdrant && 'animate-spin')} />
        </button>

        {/* Groq LPU Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-[11px] font-semibold text-indigo-800 shadow-xs">
          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
          <span>Groq GPT-OSS-20B</span>
        </div>

        {/* Seed Demo Data Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedDemo}
          isLoading={isSeeding}
          className="text-xs text-slate-700 hidden sm:inline-flex border-slate-200 hover:bg-slate-50"
        >
          {seedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Seeded!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Seed Demo</span>
            </>
          )}
        </Button>

        {/* Add Knowledge Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAddKnowledge}
          className="text-xs bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-700 hover:to-brand-700 text-white shadow-md shadow-indigo-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Knowledge</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};
