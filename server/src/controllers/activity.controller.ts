import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';

export const listActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, eventType, outcome, startDate, endDate, limit, skip } = req.query as Record<string, string>;

    const result = await ActivityService.list({
      projectId,
      eventType,
      outcome,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined
    });

    res.status(200).json({ data: result, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
