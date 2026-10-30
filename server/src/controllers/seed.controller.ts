import { Request, Response, NextFunction } from 'express';
import { SeedService } from '../services/seed.service';

export const triggerSeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const force = req.body.force === true || req.query.force === 'true';
    const result = await SeedService.seedDemoProject(force);
    res.status(200).json({ data: result, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
