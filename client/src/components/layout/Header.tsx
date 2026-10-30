import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/Button';
import {
  Menu,
  Database,
  Bot,
  Sparkles,
  PlusCircle,
  FolderKanban,
  CheckCircle2,
  RefreshCw
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

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Mobile Toggle & Project Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Project Switcher */}
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-brand-600 hidden sm:block" />
          <span className="text-xs font-medium text-slate-500 hidden sm:block">Project:</span>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 max-w-[200px] sm:max-w-[280px] truncate"
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
        </div>
      </div>

      {/* Right: Actions and Status Pills */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3 h-3 text-slate-500" />
            <span className="font-medium">MongoDB</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Bot className="w-3 h-3 text-brand-600" />
            <span className="font-medium">AI Active</span>
          </div>
        </div>

        {/* Seed Demo Data Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedDemo}
          isLoading={isSeeding}
          className="text-xs text-slate-700 hidden sm:inline-flex"
        >
          {seedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Seeded!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Seed Demo Data</span>
            </>
          )}
        </Button>

        {/* Add Knowledge Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAddKnowledge}
          className="text-xs font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Knowledge</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};
