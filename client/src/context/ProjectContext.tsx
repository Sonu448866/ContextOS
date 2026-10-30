import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem('contextos_selected_project') || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<IProject[]>('/projects');
      setProjects(data);

      // If no project selected yet or selected project no longer exists, select first
      if (data.length > 0) {
        if (!selectedProjectId || !data.some((p) => p._id === selectedProjectId)) {
          setSelectedProjectIdState(data[0]._id);
          localStorage.setItem('contextos_selected_project', data[0]._id);
        }
      } else {
        setSelectedProjectIdState(null);
        localStorage.removeItem('contextos_selected_project');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const setSelectedProjectId = (id: string | null) => {
    setSelectedProjectIdState(id);
    if (id) {
      localStorage.setItem('contextos_selected_project', id);
    } else {
      localStorage.removeItem('contextos_selected_project');
    }
  };

  const selectedProject = projects.find((p) => p._id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        refreshProjects: fetchProjects,
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
