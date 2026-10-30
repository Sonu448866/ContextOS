import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { Task } from '../models/Task';
import { AppError } from '../middleware/errorHandler.middleware';

export const listProjectTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, owner, priority, search } = req.query as Record<string, string>;
    const tasks = await TaskService.getProjectTasks(projectId, { status, owner, priority, search });
    res.status(200).json({ data: tasks, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.taskId).lean();
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    res.status(200).json({ data: task, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const task = await TaskService.createTask(
      {
        projectId,
        title: req.body.title,
        description: req.body.description,
        owner: req.body.owner,
        dueDate: req.body.dueDate,
        priority: req.body.priority,
        status: req.body.status,
        dependencies: req.body.dependencies,
        blockerDescription: req.body.blockerDescription,
        relatedDecisionIds: req.body.relatedDecisionIds
      },
      'System User',
      req.id
    );
    res.status(201).json({ data: task, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await TaskService.updateTask(req.params.taskId, req.body, 'System User', req.id);
    res.status(200).json({ data: task, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const getTaskHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const history = await TaskService.getTaskHistory(req.params.taskId);
    res.status(200).json({ data: history, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const carryForwardTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await TaskService.carryForwardTask(
      req.params.taskId,
      {
        reason: req.body.reason,
        newCycleLabel: req.body.newCycleLabel
      },
      'System User',
      req.id
    );
    res.status(200).json({ data: task, message: 'Task carried forward successfully', requestId: req.id });
  } catch (error) {
    next(error);
  }
};
