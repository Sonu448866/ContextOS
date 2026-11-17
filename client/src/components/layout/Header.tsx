import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import {
  Menu,
  Database,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles
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
      console.error('Failed to seed demo data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncQdrant = async () => {
    try {
      setIsSyncingQdrant(true);
      await api.post('/qdrant/sync');
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to sync to Qdrant:', err);
    } finally {
      setIsSyncingQdrant(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-10 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Toggle & Project Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <FolderKanban className="w-3.5 h-3.5" />
          </div>

          <div className="relative">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isLoading || projects.length === 0}
              className="text-xs font-semibold text-slate-800 bg-transparent pr-6 py-1 border-0 focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:text-indigo-600 transition-colors"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.status === 'Active' ? '• Active' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-2 pointer-events-none" />
          </div>

          {selectedProject && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              ID: {selectedProject._id.substring(selectedProject._id.length - 6)}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions & Vector Sync */}
      <div className="flex items-center gap-2.5">
        {/* Qdrant Vector Cloud Sync Button */}
        <button
          onClick={handleSyncQdrant}
          disabled={isSyncingQdrant}
          title="Sync vector embeddings to Qdrant Cloud"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
            syncSuccess
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
          )}
        >
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline font-mono text-[11px]">
            {syncSuccess ? 'Synced to Qdrant' : isSyncingQdrant ? 'Embedding...' : 'Qdrant Vector Sync'}
          </span>
          <RefreshCw className={cn('w-3 h-3 text-slate-400', isSyncingQdrant && 'animate-spin')} />
        </button>

        {/* Seed Demo Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedDemo}
          isLoading={isSeeding}
          className="text-xs gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">
            {seedSuccess ? 'Data Reset!' : 'Reset Demo Data'}
          </span>
        </Button>
      </div>
    </header>
  );
};
