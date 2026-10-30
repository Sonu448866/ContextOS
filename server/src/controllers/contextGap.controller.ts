import { Request, Response, NextFunction } from 'express';
import { ContextGapService } from '../services/contextGap.service';
import { ContextGap } from '../models/ContextGap';
import mongoose from 'mongoose';

export const analyzeGaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const gaps = await ContextGapService.analyzeProjectGaps(projectId, req.id);
    res.status(200).json({ data: gaps, message: 'Context gap detection completed', requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const listProjectGaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, severity, gapType } = req.query as Record<string, string>;

    const query: Record<string, any> = { projectId: new mongoose.Types.ObjectId(projectId) };
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (gapType) query.gapType = gapType;

    const gaps = await ContextGap.find(query).sort({ severity: 1, createdAt: -1 }).lean();
    res.status(200).json({ data: gaps, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const updateGapStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gapId } = req.params;
    const { status } = req.body;
    const updated = await ContextGapService.updateGapStatus(gapId, status, req.id);
    res.status(200).json({ data: updated, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
