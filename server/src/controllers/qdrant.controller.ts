import { Request, Response, NextFunction } from 'express';
import { QdrantService } from '../services/qdrant.service';

export const getQdrantStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await QdrantService.checkHealth();
    res.status(200).json({ data: status, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const syncQdrant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.body || {};
    const result = await QdrantService.syncAllKnowledge(projectId);
    res.status(200).json({
      data: {
        ...result,
        message: `Successfully synchronized ${result.totalChunksIndexed} vector chunks across ${result.totalSources} knowledge sources to Qdrant.`
      },
      requestId: req.id
    });
  } catch (error) {
    next(error);
  }
};
