import { Request, Response, NextFunction } from 'express';
import { AskService } from '../services/ask.service';

export const askProjectQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { question } = req.body;
    const result = await AskService.askProjectQuestion(projectId, question, req.id);
    res.status(200).json({ data: result, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
