import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IProject } from '../types/shared';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CreateProjectModal } from '../features/CreateProjectModal';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  BookOpen,
  CheckSquare,
  ShieldAlert,
  ArrowRight,
  Users,
  Calendar
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export const ProjectsPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = useQuery<
    Array<IProject & { taskCount: number; sourceCount: number; openGapsCount: number }>
  >({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects')
  });

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Workspaces</h1>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated context hubs for teams, workstreams, and product modules.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search Filter */}
      <div className="w-full sm:w-72">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects by title..."
          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading projects..." className="h-64" />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Initialize your first workspace or seed the demo E-commerce Platform.
          </p>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <Card
              key={project._id}
              className="hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge
                    variant={
                      project.status === 'Active'
                        ? 'success'
                        : project.status === 'Planning'
                        ? 'info'
                        : 'neutral'
                    }
                  >
                    {project.status}
                  </Badge>
                  {project.openGapsCount > 0 && (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      {project.openGapsCount} Gaps
                    </span>
                  )}
                </div>

                <CardTitle className="text-base font-bold text-slate-900">{project.name}</CardTitle>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Meta details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {project.members && project.members.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      <span className="truncate">{project.members.join(', ')}</span>
                    </div>
                  )}

                  {(project.startDate || project.targetDate) && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {formatDate(project.startDate)} ➔ {formatDate(project.targetDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Counts Grid */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-900 block text-sm">{project.sourceCount}</span>
                    <span className="text-[10px] text-slate-500">Knowledge Sources</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-900 block text-sm">{project.taskCount}</span>
                    <span className="text-[10px] text-slate-500">Total Tasks</span>
                  </div>
                </div>

                {/* Open Workspace Button */}
                <Link to={`/projects/${project._id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs justify-between group">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};
