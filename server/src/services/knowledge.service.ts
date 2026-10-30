import mongoose from 'mongoose';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { KnowledgeRecord } from '../models/KnowledgeRecord';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { AIService } from '../ai/ai.service';
import { TaskService } from './task.service';
import { ActivityService } from './activity.service';
import { AppError } from '../middleware/errorHandler.middleware';
import {
  IKnowledgeSource,
  KnowledgeSourceType,
  AIExtractionResult,
  IFileMetadata
} from '../types/shared';
import { logger } from '../config/logger';

export class KnowledgeService {
  public static async createSource(
    data: {
      projectId: string;
      title: string;
      sourceType: KnowledgeSourceType;
      originalText: string;
      fileMetadata?: IFileMetadata | null;
      tags?: string[];
      author?: string | null;
    },
    requestId?: string
  ): Promise<IKnowledgeSource> {
    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const source = await KnowledgeSource.create({
      projectId: new mongoose.Types.ObjectId(data.projectId),
      title: data.title,
      sourceType: data.sourceType,
      originalText: data.originalText,
      fileMetadata: data.fileMetadata || null,
      tags: data.tags || [],
      author: data.author || null,
      processingStatus: 'Completed',
      extractionStatus: 'Pending'
    });

    const sourceId = (source as any)._id.toString();

    await ActivityService.log({
      projectId: data.projectId,
      eventType: 'KnowledgeAdded',
      entityType: 'KnowledgeSource',
      entityId: sourceId,
      message: `Added knowledge source "${source.title}" (${source.sourceType})`,
      requestId,
      metadata: { sourceType: source.sourceType, hasFile: !!data.fileMetadata }
    });

    return source.toObject() as any;
  }

  public static async analyzeSource(
    sourceId: string,
    requestId?: string
  ): Promise<{ source: IKnowledgeSource; extraction: AIExtractionResult }> {
    const source = await KnowledgeSource.findById(sourceId);
    if (!source) {
      throw new AppError('Knowledge source not found', 404);
    }

    const project = await Project.findById(source.projectId);
    const projectId = (source.projectId as any).toString();

    source.extractionStatus = 'Pending';
    await source.save();

    await ActivityService.log({
      projectId,
      eventType: 'AIExtractionStarted',
      entityType: 'KnowledgeSource',
      entityId: sourceId,
      message: `Started AI knowledge extraction for "${source.title}"`,
      requestId
    });

    try {
      const extraction = await AIService.extractKnowledge({
        title: source.title,
        sourceType: source.sourceType,
        content: source.originalText,
        projectContext: project ? `${project.name}: ${project.description}` : undefined
      });

      source.extractionStatus = 'Needs Review';
      source.extractionError = null;
      await source.save();

      await ActivityService.log({
        projectId,
        eventType: 'AIExtractionCompleted',
        entityType: 'KnowledgeSource',
        entityId: sourceId,
        message: `Extracted ${extraction.decisions.length} decisions and ${extraction.actionItems.length} action items from "${source.title}"`,
        requestId,
        metadata: {
          decisionCount: extraction.decisions.length,
          taskCount: extraction.actionItems.length,
          factCount: extraction.facts.length
        }
      });

      return {
        source: source.toObject() as any,
        extraction
      };
    } catch (err: any) {
      source.extractionStatus = 'Failed';
      source.extractionError = err.message || 'AI extraction failed';
      await source.save();

      await ActivityService.log({
        projectId,
        eventType: 'AIExtractionFailed',
        entityType: 'KnowledgeSource',
        entityId: sourceId,
        message: `AI extraction failed for "${source.title}": ${err.message}`,
        outcome: 'Failure',
        requestId
      });

      throw err;
    }
  }

  // Section 6.2: Human Review and Confirmation
  public static async commitReviewedExtraction(
    sourceId: string,
    reviewedData: {
      decisions: Array<{ title: string; content: string; rationale?: string; excerpt?: string }>;
      actionItems: Array<{
        title: string;
        description?: string;
        owner?: string | null;
        dueDate?: string | null;
        priority?: 'Low' | 'Medium' | 'High' | 'Critical';
        status?: 'Open' | 'In Progress' | 'Blocked';
        blockerDescription?: string;
        dependencies?: string[];
      }>;
      facts?: Array<{ title: string; content: string; excerpt?: string }>;
    },
    actor: string = 'System User',
    requestId?: string
  ): Promise<{ committedDecisions: number; committedTasks: number }> {
    const source = await KnowledgeSource.findById(sourceId);
    if (!source) {
      throw new AppError('Knowledge source not found', 404);
    }

    const projectId = (source.projectId as any).toString();

    // 1. Commit decisions
    let decisionCount = 0;
    for (const d of reviewedData.decisions) {
      // Check existing decision for this source and title
      const existing = await KnowledgeRecord.findOne({
        projectId: source.projectId,
        sourceId: source._id,
        recordType: 'Decision',
        title: d.title
      });

      if (!existing) {
        await KnowledgeRecord.create({
          projectId: source.projectId,
          sourceId: source._id,
          recordType: 'Decision',
          title: d.title,
          content: d.content,
          structuredData: { rationale: d.rationale || '' },
          evidence: d.excerpt || '',
          reviewStatus: 'Approved'
        });
        decisionCount++;
      }
    }

    // 2. Commit facts if provided
    if (reviewedData.facts) {
      for (const f of reviewedData.facts) {
        const existing = await KnowledgeRecord.findOne({
          projectId: source.projectId,
          sourceId: source._id,
          recordType: 'Fact',
          title: f.title
        });

        if (!existing) {
          await KnowledgeRecord.create({
            projectId: source.projectId,
            sourceId: source._id,
            recordType: 'Fact',
            title: f.title,
            content: f.content,
            evidence: f.excerpt || '',
            reviewStatus: 'Approved'
          });
        }
      }
    }

    // 3. Commit action items as first-class Tasks
    let taskCount = 0;
    for (const taskItem of reviewedData.actionItems) {
      // Deduplicate: avoid creating duplicate task if same title exists in project
      const existingTask = await Task.findOne({
        projectId: source.projectId,
        title: { $regex: `^${taskItem.title.trim()}$`, $options: 'i' }
      });

      if (!existingTask) {
        await TaskService.createTask(
          {
            projectId,
            title: taskItem.title,
            description: taskItem.description || '',
            owner: taskItem.owner || null,
            dueDate: taskItem.dueDate || null,
            priority: taskItem.priority || 'Medium',
            status: taskItem.status || 'Open',
            dependencies: taskItem.dependencies || [],
            blockerDescription: taskItem.blockerDescription || null,
            sourceReferences: [
              {
                sourceId,
                title: source.title,
                excerpt: source.originalText.substring(0, 200)
              }
            ]
          },
          actor,
          requestId
        );
        taskCount++;
      }
    }

    source.extractionStatus = 'Completed';
    await source.save();

    logger.info({ sourceId, decisionCount, taskCount }, 'Committed reviewed knowledge extraction items');

    return {
      committedDecisions: decisionCount,
      committedTasks: taskCount
    };
  }

  public static async getProjectSources(projectId: string): Promise<IKnowledgeSource[]> {
    return KnowledgeSource.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  public static async getSourceById(sourceId: string): Promise<IKnowledgeSource> {
    const source = await KnowledgeSource.findById(sourceId).lean();
    if (!source) {
      throw new AppError('Knowledge source not found', 404);
    }
    return source as any;
  }
}
