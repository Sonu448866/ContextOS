import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage';
import { KnowledgeHubPage } from './pages/KnowledgeHubPage';
import { TasksPage } from './pages/TasksPage';
import { AskProjectPage } from './pages/AskProjectPage';
import { ContextTransferPage } from './pages/ContextTransferPage';
import { ContextGapDetectorPage } from './pages/ContextGapDetectorPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectWorkspacePage />} />
        <Route path="knowledge" element={<KnowledgeHubPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="ask" element={<AskProjectPage />} />
        <Route path="context-transfer" element={<ContextTransferPage />} />
        <Route path="context-gaps" element={<ContextGapDetectorPage />} />
        <Route path="activity" element={<ActivityLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
