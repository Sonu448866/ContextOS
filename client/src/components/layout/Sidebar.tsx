import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  CheckSquare,
  MessageSquareCode,
  ArrowRightLeft,
  ShieldAlert,
  Activity,
  Settings,
  Sparkles,
  Layers,
  Database,
  Cpu
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
  badgeVariant?: 'cyan' | 'amber' | 'brand';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const sections: NavSection[] = [
    {
      title: 'Platform Workspace',
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/projects', label: 'Projects', icon: FolderKanban },
        { to: '/knowledge', label: 'Knowledge Hub', icon: BookOpen, badge: 'RAG' },
        { to: '/tasks', label: 'Tasks', icon: CheckSquare }
      ]
    },
    {
      title: 'Intelligence & Continuity',
      items: [
        {
          to: '/ask',
          label: 'Ask Your Project',
          icon: MessageSquareCode,
          badge: 'Groq RAG',
          badgeVariant: 'cyan'
        },
        {
          to: '/context-gaps',
          label: 'Context Gap Detector',
          icon: ShieldAlert,
          badge: 'Original',
          badgeVariant: 'amber'
        },
        {
          to: '/context-transfer',
          label: 'Context Transfer',
          icon: ArrowRightLeft,
          badgeVariant: 'brand'
        }
      ]
    },
    {
      title: 'Governance & Audits',
      items: [
        { to: '/activity', label: 'Activity Log', icon: Activity },
        { to: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 h-full bg-[#0B0F19] text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0B0F19]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 font-sans">
              ContextOS
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.2 RAG
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Knowledge & Context Transfer</p>
          </div>
        </div>
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <p className="text-[11px] text-slate-300 italic font-normal leading-tight">
            &ldquo;Everything your team knows. Nothing your team loses.&rdquo;
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-4 grow overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/25 via-indigo-600/10 to-transparent text-white font-semibold border-l-2 border-indigo-500 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
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
                            'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-all',
                            isActive
                              ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 shadow-xs'
                              : item.badgeVariant === 'cyan'
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                              : item.badgeVariant === 'amber'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                              : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
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
        ))}
      </nav>

      {/* Footer Info: Live Engine Badges */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2 text-[10px]">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Qdrant Cloud RAG</span>
          </div>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Groq GPT-OSS-20B</span>
          </div>
          <span className="text-indigo-300 font-mono text-[9px]">LPU Ultra</span>
        </div>
      </div>
    </aside>
  );
};
