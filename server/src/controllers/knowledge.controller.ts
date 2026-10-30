import { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from '../services/knowledge.service';
import { FileParser } from '../utils/fileParser';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { AppError } from '../middleware/errorHandler.middleware';

export const createKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const source = await KnowledgeService.createSource(
      {
        projectId,
        title: req.body.title,
        sourceType: req.body.sourceType,
        originalText: req.body.originalText,
        tags: req.body.tags,
        author: req.body.author
      },
      req.id
    );
    res.status(201).json({ data: source, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const uploadKnowledgeFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError('No file was uploaded.', 400);
    }

    const title = req.body.title || file.originalname;
    const sourceType = req.body.sourceType || 'Imported Document';
    const author = req.body.author || null;
    const tags = req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [];

    // Parse file (TXT, PDF, DOCX)
    const parsed = await FileParser.parse(file);

    const source = await KnowledgeService.createSource(
      {
        projectId,
        title,
        sourceType,
        originalText: parsed.text,
        fileMetadata: parsed.metadata,
        tags,
        author
      },
      req.id
    );

    res.status(201).json({ data: source, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const listProjectKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sources = await KnowledgeService.getProjectSources(req.params.projectId);
    res.status(200).json({ data: sources, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const getKnowledgeSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const source = await KnowledgeService.getSourceById(req.params.sourceId);
    res.status(200).json({ data: source, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const deleteKnowledgeSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sourceId } = req.params;
    const source = await KnowledgeSource.findByIdAndDelete(sourceId);
    if (!source) {
      throw new AppError('Knowledge source not found', 404);
    }
    res.status(200).json({ message: 'Knowledge source deleted successfully', requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const analyzeKnowledgeSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await KnowledgeService.analyzeSource(req.params.sourceId, req.id);
    res.status(200).json({ data: result, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const commitReviewedExtraction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await KnowledgeService.commitReviewedExtraction(
      req.params.sourceId,
      req.body,
      'System User',
      req.id
    );
    res.status(200).json({ data: result, message: 'Extracted items committed successfully', requestId: req.id });
  } catch (error) {
    next(error);
  }
};
