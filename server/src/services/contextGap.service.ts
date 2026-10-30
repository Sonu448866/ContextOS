import mongoose from 'mongoose';
import { ContextGap } from '../models/ContextGap';
import { Task } from '../models/Task';
import { KnowledgeRecord } from '../models/KnowledgeRecord';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { ContextTransfer } from '../models/ContextTransfer';
import { Project } from '../models/Project';
import { AIService } from '../ai/ai.service';
import { ActivityService } from './activity.service';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { IContextGap, GapSeverity, GapType } from '../types/shared';

export class ContextGapService {
  public static async analyzeProjectGaps(
    projectId: string,
    requestId?: string
  ): Promise<IContextGap[]> {
    logger.info({ projectId }, 'Running comprehensive Context Gap Detection');

    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const tasks = await Task.find({ projectId }).lean();
    const records = await KnowledgeRecord.find({ projectId }).lean();
    const sources = await KnowledgeSource.find({ projectId }).lean();
    const transfers = await ContextTransfer.find({ projectId }).sort({ createdAt: -1 }).limit(1).lean();

    const detectedGaps: Array<{
      gapType: GapType;
      severity: GapSeverity;
      description: string;
      affectedRecordType: 'Task' | 'Decision' | 'Source' | 'Handover';
      affectedRecordId?: string | null;
      evidence: string;
      recommendedResolution: string;
      detectionMethod: 'Deterministic' | 'AI-Assisted';
    }> = [];

    // --- 1. DETERMINISTIC CHECKS ---

    // A. Tasks without owner
    for (const task of tasks) {
      if (['Open', 'In Progress'].includes(task.status) && (!task.owner || task.owner.trim() === '')) {
        detectedGaps.push({
          gapType: 'MissingOwner',
          severity: 'High',
          description: `Task "${task.title}" has no assigned owner.`,
          affectedRecordType: 'Task',
          affectedRecordId: (task as any)._id.toString(),
          evidence: `Task is in status '${task.status}' but owner field is unassigned.`,
          recommendedResolution: 'Assign a responsible team member or stakeholder to the task.',
          detectionMethod: 'Deterministic'
        });
      }
    }

    // B. Tasks without due dates when expected
    for (const task of tasks) {
      if (['Open', 'In Progress', 'Blocked'].includes(task.status) && (!task.dueDate || task.dueDate.trim() === '')) {
        const severity: GapSeverity = task.priority === 'Critical' ? 'Critical' : 'Medium';
        detectedGaps.push({
          gapType: 'MissingDueDate',
          severity,
          description: `Task "${task.title}" has no confirmed target due date recorded.`,
          affectedRecordType: 'Task',
          affectedRecordId: (task as any)._id.toString(),
          evidence: `Task priority is '${task.priority}', but due date is not specified.`,
          recommendedResolution: 'Review dependencies with the task owner and commit a target completion date.',
          detectionMethod: 'Deterministic'
        });
      }
    }

    // C. Blocked tasks with no blocker explanation
    for (const task of tasks) {
      if (task.status === 'Blocked' && (!task.blockerDescription || task.blockerDescription.trim() === '')) {
        detectedGaps.push({
          gapType: 'BlockedWithoutReason',
          severity: 'High',
          description: `Task "${task.title}" is marked as Blocked, but no blocker explanation is recorded.`,
          affectedRecordType: 'Task',
          affectedRecordId: (task as any)._id.toString(),
          evidence: `Status is 'Blocked' while blockerDescription is empty.`,
          recommendedResolution: 'Document the specific technical or organizational blocker preventing progress.',
          detectionMethod: 'Deterministic'
        });
      }
    }

    // D. Stale tasks (not updated beyond threshold)
    const staleThresholdMs = env.STALE_TASK_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    for (const task of tasks) {
      if (['Open', 'In Progress'].includes(task.status)) {
        const lastUpdated = new Date((task as any).updatedAt || (task as any).createdAt).getTime();
        const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        if (now - lastUpdated > staleThresholdMs) {
          detectedGaps.push({
            gapType: 'StaleTask',
            severity: 'Medium',
            description: `Task "${task.title}" has remained untouched for ${daysSinceUpdate} days.`,
            affectedRecordType: 'Task',
            affectedRecordId: (task as any)._id.toString(),
            evidence: `Last updated on ${(task as any).updatedAt?.toISOString?.() || task.updatedAt}.`,
            recommendedResolution: 'Check in with the owner for a status update, reprioritize, or carry forward.',
            detectionMethod: 'Deterministic'
          });
        }
      }
    }

    // E. Unresolved dependencies or Blocked without confirmed upstream deadline
    for (const task of tasks) {
      if (task.dependencies && task.dependencies.length > 0) {
        for (const dep of task.dependencies) {
          const matchingTask = tasks.find(
            (t) => (t as any)._id.toString() === dep || t.title.toLowerCase() === dep.toLowerCase()
          );

          if (!matchingTask) {
            detectedGaps.push({
              gapType: 'UnresolvedDependency',
              severity: 'High',
              description: `Task "${task.title}" references dependency "${dep}" which cannot be found in the project.`,
              affectedRecordType: 'Task',
              affectedRecordId: (task as any)._id.toString(),
              evidence: `Dependency reference '${dep}' is missing or unlinked.`,
              recommendedResolution: 'Create the missing dependency task or link the correct task record.',
              detectionMethod: 'Deterministic'
            });
          } else if (matchingTask.status !== 'Completed') {
            if (task.status === 'Blocked' && !matchingTask.dueDate) {
              detectedGaps.push({
                gapType: 'MissingDueDate',
                severity: 'Critical',
                description: `"${task.title}" is blocked waiting for "${matchingTask.title}", which has no confirmed deadline.`,
                affectedRecordType: 'Task',
                affectedRecordId: (matchingTask as any)._id.toString(),
                evidence: `Blocked dependency relationship between Task [${task.title}] and Task [${matchingTask.title}].`,
                recommendedResolution: `Establish and record a confirmed completion date for "${matchingTask.title}" to unblock "${task.title}".`,
                detectionMethod: 'Deterministic'
              });
            }
          }
        }
      }
    }

    // F. Decisions without recorded rationale
    for (const record of records) {
      if (record.recordType === 'Decision') {
        const rationale = record.structuredData?.rationale || '';
        if (!rationale || rationale.trim() === '') {
          detectedGaps.push({
            gapType: 'MissingRationale',
            severity: 'Medium',
            description: `Decision "${record.title}" was recorded without an underlying rationale or reasoning.`,
            affectedRecordType: 'Decision',
            affectedRecordId: (record as any)._id.toString(),
            evidence: `Decision record [${record.title}] has empty rationale field.`,
            recommendedResolution: 'Record the context, trade-offs, and reasons why this decision was made.',
            detectionMethod: 'Deterministic'
          });
        }
      }
    }

    // G. Open tasks omitted from latest handover package
    if (transfers.length > 0) {
      const latestTransfer = transfers[0];
      const handoverOpenTasks = latestTransfer.generatedContent?.openTasks || [];
      const handoverTaskTitles = new Set(handoverOpenTasks.map((t: any) => t.title.toLowerCase().trim()));

      for (const task of tasks) {
        if (['Open', 'In Progress', 'Blocked'].includes(task.status)) {
          if (!handoverTaskTitles.has(task.title.toLowerCase().trim())) {
            detectedGaps.push({
              gapType: 'OmittedOpenTask',
              severity: 'Medium',
              description: `Open task "${task.title}" was omitted from the latest context handover (${latestTransfer.transferType}).`,
              affectedRecordType: 'Handover',
              affectedRecordId: (latestTransfer as any)._id.toString(),
              evidence: `Task is active in project but missing from transfer handover generated at ${latestTransfer.createdAt}.`,
              recommendedResolution: 'Regenerate the context transfer to ensure the incoming owner has complete visibility.',
              detectionMethod: 'Deterministic'
            });
          }
        }
      }
    }

    // --- 2. AI-ASSISTED CHECKS (Contradictions, Unrepresented Blockers, Status Mismatches) ---
    try {
      const aiGaps = await AIService.detectContradictions({
        project: { name: project.name, description: project.description },
        sources: sources.map((s) => ({
          id: (s as any)._id.toString(),
          title: s.title,
          sourceType: s.sourceType,
          text: s.originalText
        })),
        tasks: tasks.map((t) => ({
          id: (t as any)._id.toString(),
          title: t.title,
          owner: t.owner,
          dueDate: t.dueDate,
          status: t.status,
          blockerDescription: t.blockerDescription
        })),
        decisions: records
          .filter((r) => r.recordType === 'Decision')
          .map((d) => ({
            id: (d as any)._id.toString(),
            title: d.title,
            content: d.content,
            rationale: d.structuredData?.rationale
          }))
      });

      for (const aiGap of aiGaps) {
        detectedGaps.push({
          gapType: aiGap.gapType as GapType,
          severity: aiGap.severity,
          description: aiGap.description,
          affectedRecordType: aiGap.affectedRecordType,
          affectedRecordId: aiGap.affectedRecordId,
          evidence: aiGap.evidence,
          recommendedResolution: aiGap.recommendedResolution,
          detectionMethod: 'AI-Assisted'
        });
      }
    } catch (aiErr: any) {
      logger.warn({ aiErr: aiErr.message }, 'AI contradiction check skipped due to error or unavailable provider');
    }

    // --- 3. PERSIST AND DEDUPLICATE GAPS ---
    const savedGaps: IContextGap[] = [];
    const nowIso = new Date().toISOString();

    for (const item of detectedGaps) {
      // Find existing gap with same project, gapType, and affectedRecordId or description
      const existing = await ContextGap.findOne({
        projectId: new mongoose.Types.ObjectId(projectId),
        gapType: item.gapType,
        $or: [
          { affectedRecordId: item.affectedRecordId || 'none' },
          { description: item.description }
        ],
        status: { $in: ['Open', 'Acknowledged'] }
      });

      if (existing) {
        // Update severity / evidence if changed
        existing.severity = item.severity;
        existing.evidence = item.evidence;
        existing.recommendedResolution = item.recommendedResolution;
        await existing.save();
        savedGaps.push(existing.toObject() as any);
      } else {
        const created = await ContextGap.create({
          projectId: new mongoose.Types.ObjectId(projectId),
          gapType: item.gapType,
          severity: item.severity,
          description: item.description,
          affectedRecordType: item.affectedRecordType,
          affectedRecordId: item.affectedRecordId || null,
          evidence: item.evidence,
          recommendedResolution: item.recommendedResolution,
          detectionMethod: item.detectionMethod,
          status: 'Open',
          detectedAt: nowIso
        });

        await ActivityService.log({
          projectId,
          eventType: 'ContextGapDetected',
          entityType: 'ContextGap',
          entityId: (created as any)._id.toString(),
          message: `Detected [${item.severity}] ${item.gapType}: ${item.description}`,
          requestId,
          metadata: {
            gapType: item.gapType,
            severity: item.severity,
            detectionMethod: item.detectionMethod
          }
        });

        savedGaps.push(created.toObject() as any);
      }
    }

    logger.info({ projectId, totalGaps: savedGaps.length }, 'Context gap analysis completed');
    return savedGaps;
  }

  public static async updateGapStatus(
    gapId: string,
    status: 'Open' | 'Acknowledged' | 'Resolved' | 'Dismissed',
    requestId?: string
  ): Promise<IContextGap> {
    const gap = await ContextGap.findById(gapId);
    if (!gap) {
      throw new Error('Context Gap record not found');
    }

    const prevStatus = gap.status;
    gap.status = status;
    if (status === 'Resolved' || status === 'Dismissed') {
      gap.resolvedAt = new Date().toISOString();
    } else {
      gap.resolvedAt = null;
    }

    await gap.save();

    await ActivityService.log({
      projectId: (gap.projectId as any).toString(),
      eventType: status === 'Resolved' ? 'ContextGapResolved' : 'ContextGapDismissed',
      entityType: 'ContextGap',
      entityId: (gap as any)._id.toString(),
      message: `Context gap status changed from ${prevStatus} to ${status}: ${gap.description}`,
      requestId,
      metadata: { previousStatus: prevStatus, newStatus: status, gapType: gap.gapType }
    });

    return gap.toObject() as any;
  }
}
