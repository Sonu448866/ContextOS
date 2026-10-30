import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { ContextGap } from '../models/ContextGap';
import { ActivityService } from './activity.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { IProject, ProjectStatus } from '../types/shared';
import { logger } from '../config/logger';

export class ProjectService {
  public static async createProject(
    data: {
      name: string;
      description?: string;
      status?: ProjectStatus;
      members?: string[];
      startDate?: string | null;
      targetDate?: string | null;
    },
    requestId?: string
  ): Promise<IProject> {
    const project = await Project.create({
      name: data.name,
      description: data.description || '',
      status: data.status || 'Active',
      members: data.members || [],
      startDate: data.startDate || null,
      targetDate: data.targetDate || null
    });

    const projectId = (project as any)._id.toString();

    await ActivityService.log({
      projectId,
      eventType: 'ProjectCreated',
      entityType: 'Project',
      entityId: projectId,
      message: `Created project "${project.name}" (Status: ${project.status})`,
      requestId,
      metadata: { status: project.status, membersCount: project.members.length }
    });

    return project.toObject() as any;
  }

  public static async listProjects(): Promise<Array<IProject & { taskCount: number; sourceCount: number; openGapsCount: number }>> {
    const projects = await Project.find().sort({ updatedAt: -1 }).lean();

    const results = await Promise.all(
      projects.map(async (p) => {
        const [taskCount, sourceCount, openGapsCount] = await Promise.all([
          Task.countDocuments({ projectId: p._id }),
          KnowledgeSource.countDocuments({ projectId: p._id }),
          ContextGap.countDocuments({ projectId: p._id, status: { $in: ['Open', 'Acknowledged'] } })
        ]);

        return {
          ...(p as any),
          taskCount,
          sourceCount,
          openGapsCount
        };
      })
    );

    return results;
  }

  public static async getProjectById(projectId: string): Promise<IProject> {
    const project = await Project.findById(projectId).lean();
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    return project as any;
  }

  public static async updateProject(
    projectId: string,
    updates: Partial<{
      name: string;
      description: string;
      status: ProjectStatus;
      members: string[];
      startDate: string | null;
      targetDate: string | null;
    }>,
    requestId?: string
  ): Promise<IProject> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (updates.name !== undefined) project.name = updates.name;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.status !== undefined) project.status = updates.status;
    if (updates.members !== undefined) project.members = updates.members;
    if (updates.startDate !== undefined) project.startDate = updates.startDate;
    if (updates.targetDate !== undefined) project.targetDate = updates.targetDate;

    await project.save();

    await ActivityService.log({
      projectId,
      eventType: 'ProjectUpdated',
      entityType: 'Project',
      entityId: projectId,
      message: `Updated project "${project.name}"`,
      requestId,
      metadata: updates
    });

    return project.toObject() as any;
  }
}
