import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await ProjectService.createProject(req.body, req.id);
    res.status(201).json({ data: project, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await ProjectService.listProjects();
    res.status(200).json({ data: projects, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await ProjectService.getProjectById(req.params.projectId);
    res.status(200).json({ data: project, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await ProjectService.updateProject(req.params.projectId, req.body, req.id);
    res.status(200).json({ data: project, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
