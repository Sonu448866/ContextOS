import mongoose from 'mongoose';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { Task } from '../models/Task';
import { KnowledgeRecord } from '../models/KnowledgeRecord';
import { Project } from '../models/Project';
import { AIService } from '../ai/ai.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { AIQuestionAnswer } from '../types/shared';
import { logger } from '../config/logger';

export class AskService {
  public static async askProjectQuestion(
    projectId: string,
    question: string,
    _requestId?: string
  ): Promise<AIQuestionAnswer> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // 1. Bounded Context Retrieval
    // Retrieve up to 10 most relevant or recent sources for this project
    const sources = await KnowledgeSource.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Retrieve active and recent tasks
    const tasks = await Task.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    // Retrieve decisions
    const decisions = await KnowledgeRecord.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      recordType: 'Decision'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    logger.info(
      {
        projectId,
        questionLength: question.length,
        sourcesFound: sources.length,
        tasksFound: tasks.length,
        decisionsFound: decisions.length
      },
      'Retrieved bounded context for question answering'
    );

    // 2. Call AI Question-Answering pipeline
    const result = await AIService.askProject({
      question,
      project: { name: project.name, description: project.description },
      contextSources: sources.map((s) => ({
        id: (s as any)._id.toString(),
        title: s.title,
        sourceType: s.sourceType,
        text: s.originalText
      })),
      contextTasks: tasks.map((t) => ({
        id: (t as any)._id.toString(),
        title: t.title,
        owner: t.owner,
        status: t.status,
        blockerDescription: t.blockerDescription,
        dueDate: t.dueDate
      })),
      contextDecisions: decisions.map((d) => ({
        id: (d as any)._id.toString(),
        title: d.title,
        content: d.content,
        rationale: d.structuredData?.rationale
      }))
    });

    return result;
  }
}
