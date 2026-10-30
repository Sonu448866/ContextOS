import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IProject } from '../types/shared';

interface ProjectContextType {
  projects: IProject[];
  selectedProjectId: string | null;
  selectedProject: IProject | null;
  setSelectedProjectId: (id: string | null) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem('contextos_selected_project') || null;
  });

  const {
    data: projects = [],
    isLoading,
    refetch
  } = useQuery<IProject[]>({
    queryKey: ['projects'],
    queryFn: () => api.get<IProject[]>('/projects'),
    refetchOnWindowFocus: true,
    staleTime: 10000,
    retry: 3
  });

  // Automatically select first project if none selected or selected project was deleted
  useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProjectId || !projects.some((p) => p._id === selectedProjectId)) {
        const defaultId = projects[0]._id;
        setSelectedProjectIdState(defaultId);
        localStorage.setItem('contextos_selected_project', defaultId);
      }
    }
  }, [projects, selectedProjectId]);

  const setSelectedProjectId = (id: string | null) => {
    setSelectedProjectIdState(id);
    if (id) {
      localStorage.setItem('contextos_selected_project', id);
    } else {
      localStorage.removeItem('contextos_selected_project');
    }
  };

  const selectedProject = projects.find((p) => p._id === selectedProjectId) || null;

  const refreshProjects = async () => {
    await refetch();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        refreshProjects,
        isLoading
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
