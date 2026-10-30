import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.query as { projectId?: string };
    const summary = await DashboardService.getSummary(projectId);
    res.status(200).json({ data: summary, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
