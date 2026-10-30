import { Project } from '../models/Project';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { Task } from '../models/Task';
import { ContextGap } from '../models/ContextGap';
import { ActivityEvent } from '../models/ActivityEvent';
import { DashboardSummary } from '../types/shared';

export class DashboardService {
  public static async getSummary(projectId?: string): Promise<DashboardSummary> {
    const projectFilter: Record<string, any> = {};
    if (projectId) {
      projectFilter.projectId = projectId;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalActiveProjects,
      totalKnowledgeSources,
      openTasks,
      blockedTasks,
      tasksMissingOwners,
      overdueTasks,
      criticalContextGaps,
      recentActivity,
      recentKnowledge,
      upcomingDeadlines,
      criticalGaps
    ] = await Promise.all([
      Project.countDocuments({ status: 'Active' }),
      KnowledgeSource.countDocuments(projectFilter),
      Task.countDocuments({
        ...projectFilter,
        status: { $in: ['Open', 'In Progress', 'Blocked'] }
      }),
      Task.countDocuments({ ...projectFilter, status: 'Blocked' }),
      Task.countDocuments({
        ...projectFilter,
        status: { $in: ['Open', 'In Progress'] },
        $or: [{ owner: null }, { owner: '' }]
      }),
      Task.countDocuments({
        ...projectFilter,
        status: { $in: ['Open', 'In Progress', 'Blocked'] },
        dueDate: { $ne: null, $lt: todayStr }
      }),
      ContextGap.countDocuments({
        ...projectFilter,
        severity: 'Critical',
        status: { $in: ['Open', 'Acknowledged'] }
      }),
      ActivityEvent.find(projectFilter ? { ...(projectId ? { projectId } : {}) } : {})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      KnowledgeSource.find(projectFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Task.find({
        ...projectFilter,
        status: { $in: ['Open', 'In Progress', 'Blocked'] },
        dueDate: { $ne: null, $gte: todayStr }
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),
      ContextGap.find({
        ...projectFilter,
        severity: { $in: ['Critical', 'High'] },
        status: { $in: ['Open', 'Acknowledged'] }
      })
        .sort({ severity: 1, createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Calculate Project Health Score
    // Base 100, deducted by critical gaps (-15 each), blocked tasks (-10 each), overdue tasks (-5 each), missing owners (-5 each)
    let healthScore = 100 - criticalContextGaps * 15 - blockedTasks * 10 - overdueTasks * 5 - tasksMissingOwners * 5;
    if (healthScore < 0) healthScore = 0;

    let healthStatus: 'Healthy' | 'At Risk' | 'Critical' = 'Healthy';
    let healthSummary = 'All project parameters, tasks, and context indicators are running smoothly.';

    if (criticalContextGaps > 0 || blockedTasks >= 2 || healthScore < 50) {
      healthStatus = 'Critical';
      healthSummary = `Critical attention needed: ${criticalContextGaps} critical gaps and ${blockedTasks} blocked tasks detected.`;
    } else if (blockedTasks > 0 || tasksMissingOwners > 0 || healthScore < 80) {
      healthStatus = 'At Risk';
      healthSummary = `Moderate continuity risk: ${blockedTasks} blocked task and ${tasksMissingOwners} unassigned tasks require action.`;
    }

    return {
      totalActiveProjects,
      totalKnowledgeSources,
      openTasks,
      overdueTasks,
      blockedTasks,
      tasksMissingOwners,
      criticalContextGaps,
      projectHealth: {
        status: healthStatus,
        score: healthScore,
        summary: healthSummary
      },
      recentActivity: recentActivity as any,
      recentKnowledge: recentKnowledge as any,
      upcomingDeadlines: upcomingDeadlines as any,
      criticalGaps: criticalGaps as any
    };
  }
}
