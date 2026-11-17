import React from 'react';
import { NavLink } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  CheckSquare,
  ShieldAlert,
  ArrowRightLeft,
  MessageSquareCode,
  Activity,
  Settings,
  Database,
  Cpu,
  Layers,
  Sparkles,
  GitCommit,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { selectedProject } = useProject();

  const sections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/projects', label: 'Projects', icon: FolderKanban },
        { to: '/knowledge', label: 'Knowledge Hub', icon: BookOpen },
        { to: '/tasks', label: 'Tasks & Commitments', icon: CheckSquare }
      ]
    },
    {
      title: 'Context Intelligence',
      items: [
        {
          to: '/ask',
          label: 'Ask Project AI',
          icon: MessageSquareCode,
          badge: 'RAG'
        },
        {
          to: '/context-gaps',
          label: 'Context Gap Detector',
          icon: ShieldAlert
        },
        {
          to: '/context-transfer',
          label: 'Context Transfer',
          icon: ArrowRightLeft,
          badge: '17-Part'
        }
      ]
    },
    {
      title: 'Governance',
      items: [
        { to: '/activity', label: 'Activity Log', icon: Activity },
        { to: '/settings', label: 'Settings & Status', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 h-full bg-[#0A0D14] text-slate-400 flex flex-col border-r border-slate-800/70 shrink-0 select-none">
      {/* Brand & Project Identity */}
      <div className="p-4 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tight">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">ContextOS</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                v1.2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
              {selectedProject?.name || 'Enterprise Workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {section.title}
            </h3>

            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                        isActive
                          ? 'bg-slate-800/90 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors',
                              isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                            )}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={cn(
                              'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider',
                              isActive
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Engine Telemetry (Understated & Functional) */}
      <div className="p-3.5 m-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Vector Engine</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        <div className="space-y-1 text-slate-400 font-mono text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Vector DB:</span>
            <span className="text-slate-300">Qdrant Cloud (384-d)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Embeddings:</span>
            <span className="text-slate-300">SentenceTransformers</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Inference:</span>
            <span className="text-slate-300">Groq gpt-oss-20b</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
