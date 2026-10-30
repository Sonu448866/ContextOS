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
  Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/knowledge', label: 'Knowledge Hub', icon: BookOpen },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    {
      to: '/ask',
      label: 'Ask Your Project',
      icon: MessageSquareCode,
      badge: 'AI'
    },
    {
      to: '/context-transfer',
      label: 'Context Transfer',
      icon: ArrowRightLeft,
      highlight: true
    },
    {
      to: '/context-gaps',
      label: 'Context Gap Detector',
      icon: ShieldAlert,
      badge: 'Original'
    },
    { to: '/activity', label: 'Activity Log', icon: Activity },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              ContextOS
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Knowledge & Context Transfer</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic mt-2.5 font-normal leading-tight">
          &ldquo;Everything your team knows. Nothing your team loses.&rdquo;
        </p>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 grow overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Platform Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'Original'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
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
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>AI-Powered Platform</span>
        </div>
        <span className="text-[10px] text-slate-400">Atlas Ready</span>
      </div>
    </aside>
  );
};
