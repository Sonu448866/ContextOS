import mongoose from 'mongoose';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { Task } from '../models/Task';
import { KnowledgeRecord } from '../models/KnowledgeRecord';
import { Project } from '../models/Project';
import { AIService } from '../ai/ai.service';
import { QdrantService, QdrantSearchResult } from './qdrant.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { AIQuestionAnswer, VectorSearchMetadata } from '../types/shared';
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

    // 1. Semantic Vector Search via Qdrant
    const vectorStart = Date.now();
    let qdrantMatches: QdrantSearchResult[] = [];
    try {
      qdrantMatches = await QdrantService.search({
        query: question,
        projectId,
        limit: 5
      });
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Qdrant vector retrieval encountered error, proceeding with database sources');
    }
    const vectorLatencyMs = Date.now() - vectorStart;

    // 2. Database Context Retrieval
    const sources = await KnowledgeSource.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const tasks = await Task.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    const decisions = await KnowledgeRecord.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      recordType: 'Decision'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Prepare combined sources: semantic chunks from Qdrant + full sources
    const contextSources = sources.map((s) => ({
      id: (s as any)._id.toString(),
      title: s.title,
      sourceType: s.sourceType,
      text: s.originalText
    }));

    // If Qdrant found chunks, prepend them so the model prioritizes semantically matched excerpts
    if (qdrantMatches.length > 0) {
      for (const match of qdrantMatches) {
        if (!contextSources.some((cs) => cs.id === match.sourceId)) {
          contextSources.unshift({
            id: match.sourceId,
            title: match.sourceTitle,
            sourceType: (match.sourceType as any) || 'General Note',
            text: match.text
          });
        }
      }
    }

    logger.info(
      {
        projectId,
        questionLength: question.length,
        qdrantChunksFound: qdrantMatches.length,
        sourcesFound: sources.length,
        tasksFound: tasks.length,
        decisionsFound: decisions.length
      },
      'Retrieved RAG vector context for question answering'
    );

    // 3. Call AI Question-Answering pipeline (Groq / Gemini)
    const result = await AIService.askProject({
      question,
      project: { name: project.name, description: project.description },
      contextSources,
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

    // 4. Attach vector search metadata for frontend RAG citation cards
    const qdrantHealth = await QdrantService.checkHealth();
    const vectorSearchMetadata: VectorSearchMetadata = {
      provider: 'Qdrant',
      connected: qdrantHealth.connected,
      collection: qdrantHealth.collectionName,
      queryLatencyMs: vectorLatencyMs,
      topScore: qdrantMatches[0]?.score || 0,
      chunksRetrieved: qdrantMatches.length,
      matches: qdrantMatches.map((m) => ({
        score: m.score,
        rawScore: m.rawScore,
        chunkId: m.chunkId,
        text: m.text,
        sourceTitle: m.sourceTitle,
        sourceId: m.sourceId,
        sourceType: m.sourceType,
        author: m.author
      }))
    };

    return {
      ...result,
      vectorSearchMetadata
    };
  }
}
