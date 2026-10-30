import mongoose from 'mongoose';
import { Task, ITaskDocument } from '../models/Task';
import { TaskHistory } from '../models/TaskHistory';
import { ActivityService } from './activity.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { ITask, TaskPriority, TaskStatus, ISourceReference } from '../types/shared';
import { logger } from '../config/logger';

export class TaskService {
  public static async createTask(
    data: {
      projectId: string;
      title: string;
      description?: string;
      owner?: string | null;
      dueDate?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dependencies?: string[];
      blockerDescription?: string | null;
      sourceReferences?: ISourceReference[];
      relatedDecisionIds?: string[];
    },
    actor: string = 'System User',
    requestId?: string
  ): Promise<ITask> {
    const task = await Task.create({
      projectId: new mongoose.Types.ObjectId(data.projectId),
      title: data.title,
      description: data.description || '',
      owner: data.owner || null,
      dueDate: data.dueDate || null,
      priority: data.priority || 'Medium',
      status: data.status || 'Open',
      dependencies: data.dependencies || [],
      blockerDescription: data.blockerDescription || null,
      sourceReferences: data.sourceReferences || [],
      relatedDecisionIds: data.relatedDecisionIds || [],
      carriedForwardCount: 0
    });

    const taskId = (task as any)._id.toString();

    // Append-only history record
    await TaskHistory.create({
      taskId: (task as any)._id,
      projectId: task.projectId,
      eventType: 'Created',
      newValue: JSON.stringify({
        title: task.title,
        owner: task.owner,
        priority: task.priority,
        status: task.status
      }),
      actor,
      requestId
    });

    // Activity logging
    await ActivityService.log({
      projectId: data.projectId,
      eventType: 'TaskCreated',
      entityType: 'Task',
      entityId: taskId,
      message: `Created task "${task.title}" (Priority: ${task.priority}, Status: ${task.status})`,
      requestId,
      metadata: { owner: task.owner, priority: task.priority, status: task.status }
    });

    return task.toObject() as any;
  }

  public static async updateTask(
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      owner: string | null;
      dueDate: string | null;
      priority: TaskPriority;
      status: TaskStatus;
      dependencies: string[];
      blockerDescription: string | null;
      sourceReferences: ISourceReference[];
    }>,
    actor: string = 'System User',
    requestId?: string
  ): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const projectId = (task.projectId as any).toString();

    // Check status transition
    if (updates.status && updates.status !== task.status) {
      const prevStatus = task.status;
      task.status = updates.status;

      if (updates.status === 'Completed') {
        task.completedAt = new Date().toISOString();
        await TaskHistory.create({
          taskId: task._id,
          projectId: task.projectId,
          eventType: 'Completed',
          previousValue: prevStatus,
          newValue: 'Completed',
          actor,
          requestId
        });
      } else if (prevStatus === 'Completed') {
        task.completedAt = null;
        await TaskHistory.create({
          taskId: task._id,
          projectId: task.projectId,
          eventType: 'Reopened',
          previousValue: prevStatus,
          newValue: updates.status,
          actor,
          requestId
        });
      } else {
        await TaskHistory.create({
          taskId: task._id,
          projectId: task.projectId,
          eventType: 'StatusChanged',
          previousValue: prevStatus,
          newValue: updates.status,
          actor,
          requestId
        });
      }

      await ActivityService.log({
        projectId,
        eventType: 'TaskStatusChanged',
        entityType: 'Task',
        entityId: taskId,
        message: `Task "${task.title}" status changed from ${prevStatus} to ${updates.status}`,
        requestId,
        metadata: { prevStatus, newStatus: updates.status }
      });
    }

    // Check owner change
    if (updates.owner !== undefined && updates.owner !== task.owner) {
      const prevOwner = task.owner;
      task.owner = updates.owner;

      await TaskHistory.create({
        taskId: task._id,
        projectId: task.projectId,
        eventType: prevOwner ? 'OwnerChanged' : 'OwnerAssigned',
        previousValue: prevOwner || 'None',
        newValue: updates.owner || 'None',
        actor,
        requestId
      });

      await ActivityService.log({
        projectId,
        eventType: 'TaskReassigned',
        entityType: 'Task',
        entityId: taskId,
        message: `Task "${task.title}" reassigned to ${updates.owner || 'Unassigned'}`,
        requestId,
        metadata: { prevOwner, newOwner: updates.owner }
      });
    }

    // Check due date change
    if (updates.dueDate !== undefined && updates.dueDate !== task.dueDate) {
      const prevDueDate = task.dueDate;
      task.dueDate = updates.dueDate;

      await TaskHistory.create({
        taskId: task._id,
        projectId: task.projectId,
        eventType: 'DueDateChanged',
        previousValue: prevDueDate || 'None',
        newValue: updates.dueDate || 'None',
        actor,
        requestId
      });
    }

    // Check blocker description
    if (updates.blockerDescription !== undefined && updates.blockerDescription !== task.blockerDescription) {
      const prevBlocker = task.blockerDescription;
      task.blockerDescription = updates.blockerDescription;

      const eventType = updates.blockerDescription ? 'BlockerAdded' : 'BlockerResolved';
      await TaskHistory.create({
        taskId: task._id,
        projectId: task.projectId,
        eventType,
        previousValue: prevBlocker || 'None',
        newValue: updates.blockerDescription || 'None',
        actor,
        requestId
      });
    }

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.dependencies !== undefined) task.dependencies = updates.dependencies;
    if (updates.sourceReferences !== undefined) task.sourceReferences = updates.sourceReferences;

    await task.save();

    return task.toObject() as any;
  }

  // Section 7.3: Carry-forward preserving task identity, creation date, and history
  public static async carryForwardTask(
    taskId: string,
    params: { reason?: string; newCycleLabel?: string },
    actor: string = 'System User',
    requestId?: string
  ): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found for carry-forward', 404);
    }

    task.carriedForwardCount = (task.carriedForwardCount || 0) + 1;
    await task.save();

    const projectId = (task.projectId as any).toString();

    await TaskHistory.create({
      taskId: task._id,
      projectId: task.projectId,
      eventType: 'CarriedForward',
      previousValue: `Cycle count: ${task.carriedForwardCount - 1}`,
      newValue: `Carried forward to next cycle (${params.newCycleLabel || 'Next Work Cycle'}). Reason: ${params.reason || 'Unfinished open work'}`,
      actor,
      requestId
    });

    await ActivityService.log({
      projectId,
      eventType: 'TaskCarriedForward',
      entityType: 'Task',
      entityId: taskId,
      message: `Carried forward task "${task.title}" to ${params.newCycleLabel || 'next cycle'} (Total carries: ${task.carriedForwardCount})`,
      requestId,
      metadata: { carriedForwardCount: task.carriedForwardCount, reason: params.reason }
    });

    return task.toObject() as any;
  }

  public static async getTaskHistory(taskId: string): Promise<any[]> {
    return TaskHistory.find({ taskId: new mongoose.Types.ObjectId(taskId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  public static async getProjectTasks(
    projectId: string,
    filters?: {
      status?: string;
      owner?: string;
      priority?: string;
      search?: string;
    }
  ): Promise<ITask[]> {
    const query: Record<string, any> = { projectId: new mongoose.Types.ObjectId(projectId) };

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.owner) {
      query.owner = filters.owner;
    }
    if (filters?.priority) {
      query.priority = filters.priority;
    }
    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return Task.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean() as any;
  }
}
