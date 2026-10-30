import mongoose from 'mongoose';
import { ContextTransfer } from '../models/ContextTransfer';
import { Project } from '../models/Project';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { Task } from '../models/Task';
import { KnowledgeRecord } from '../models/KnowledgeRecord';
import { ContextGap } from '../models/ContextGap';
import { AIService } from '../ai/ai.service';
import { ActivityService } from './activity.service';
import { AppError } from '../middleware/errorHandler.middleware';
import {
  IContextTransfer,
  TransferType,
  IHandoverPackage,
  ISourceReference
} from '../types/shared';
import { logger } from '../config/logger';

export class ContextTransferService {
  private static renderMarkdownHandover(
    pkg: IHandoverPackage,
    meta: { projectName: string; transferType: string; outgoingOwner?: string | null; incomingOwner?: string | null }
  ): string {
    return `# Context Transfer Handover: ${meta.projectName}
**Transfer Type:** ${meta.transferType}  
**Outgoing Owner:** ${meta.outgoingOwner || 'N/A'}  
**Incoming Owner:** ${meta.incomingOwner || 'N/A'}  
**Generated At:** ${new Date().toUTCString()}

---

## 1. Executive Summary
${pkg.executiveSummary}

## 2. Project Background
${pkg.projectBackground}

## 3. Current Project State
${pkg.currentProjectState}

## 4. Important Decisions
${pkg.importantDecisions.map((d) => `- **${d.title}**: ${d.content} (Rationale: ${d.rationale || 'None recorded'})`).join('\n') || 'No major architectural decisions recorded.'}

## 5. Decision Rationale
${pkg.decisionRationale}

## 6. Completed Work
${pkg.completedWork.map((w) => `- ${w}`).join('\n') || 'None recorded.'}

## 7. Open Tasks
${pkg.openTasks.map((t) => `- [${t.status}] **${t.title}** (Priority: ${t.priority}, Owner: ${t.owner || 'Unassigned'}, Due: ${t.dueDate || 'No deadline'})`).join('\n') || 'No open tasks.'}

## 8. Task Owners and Due Dates
${pkg.taskOwnersAndDueDates}

## 9. Blockers
${pkg.blockers.map((b) => `- ⚠️ **${b.title}**: ${b.description} ${b.affectedTask ? `(Affects: ${b.affectedTask})` : ''}`).join('\n') || 'No active blockers recorded.'}

## 10. Dependencies
${pkg.dependencies.map((d) => `- **${d.dependent}** ➔ depends on ➔ **${d.dependsOn}**`).join('\n') || 'No explicit dependencies documented.'}

## 11. Known Risks
${pkg.knownRisks.map((r) => `- 🚨 **${r.title}**: ${r.impact || 'Impact unquantified'}`).join('\n') || 'No critical risks identified.'}

## 12. Unresolved Questions
${pkg.unresolvedQuestions.map((q) => `- ❓ ${q}`).join('\n') || 'No open questions.'}

## 13. Recent Changes
${pkg.recentChanges.map((c) => `- ${c}`).join('\n') || 'No recent updates logged.'}

## 14. Critical Documentation
${pkg.criticalDocumentation.map((doc) => `- 📄 **${doc.title}** (${doc.reference || 'See Knowledge Hub'})`).join('\n') || 'None listed.'}

## 15. Recommended Next Steps
${pkg.recommendedNextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n') || 'Continue current sprint plan.'}

## 16. Missing or Conflicting Information
${pkg.missingOrConflictingInformation.map((item) => `- ⚠️ ${item}`).join('\n') || 'No missing or conflicting information identified.'}

## 17. Source References
${pkg.sourceReferences.map((ref) => `- [Source ${ref.sourceId}] ${ref.title}`).join('\n') || 'None cited.'}
`;
  }

  public static async generateTransfer(
    data: {
      projectId: string;
      transferType: TransferType;
      outgoingOwner?: string | null;
      incomingOwner?: string | null;
      period?: string | null;
      instructions?: string | null;
      selectedSourceIds?: string[];
      selectedTaskIds?: string[];
    },
    requestId?: string
  ): Promise<IContextTransfer> {
    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    logger.info({ projectId: data.projectId, transferType: data.transferType }, 'Generating Context Transfer Handover');

    // Fetch sources
    const sourceQuery: Record<string, any> = { projectId: new mongoose.Types.ObjectId(data.projectId) };
    if (data.selectedSourceIds && data.selectedSourceIds.length > 0) {
      sourceQuery._id = { $in: data.selectedSourceIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }
    const sources = await KnowledgeSource.find(sourceQuery).lean();

    // Fetch tasks
    const taskQuery: Record<string, any> = { projectId: new mongoose.Types.ObjectId(data.projectId) };
    if (data.selectedTaskIds && data.selectedTaskIds.length > 0) {
      taskQuery._id = { $in: data.selectedTaskIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }
    const tasks = await Task.find(taskQuery).lean();

    // Fetch decisions
    const decisions = await KnowledgeRecord.find({
      projectId: new mongoose.Types.ObjectId(data.projectId),
      recordType: 'Decision'
    }).lean();

    // Fetch active gaps
    const gaps = await ContextGap.find({
      projectId: new mongoose.Types.ObjectId(data.projectId),
      status: { $in: ['Open', 'Acknowledged'] }
    }).lean();

    // Call AI Context Transfer Engine
    const handoverPackage = await AIService.generateContextTransfer({
      project: { name: project.name, description: project.description },
      transferType: data.transferType,
      outgoingOwner: data.outgoingOwner,
      incomingOwner: data.incomingOwner,
      period: data.period,
      instructions: data.instructions,
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
        priority: t.priority,
        blockerDescription: t.blockerDescription,
        dependencies: t.dependencies
      })),
      decisions: decisions.map((d) => ({
        id: (d as any)._id.toString(),
        title: d.title,
        content: d.content,
        rationale: d.structuredData?.rationale
      })),
      gaps: gaps.map((g) => ({
        gapType: g.gapType,
        description: g.description,
        severity: g.severity
      }))
    });

    // Render markdown document
    const rawMarkdown = ContextTransferService.renderMarkdownHandover(handoverPackage, {
      projectName: project.name,
      transferType: data.transferType,
      outgoingOwner: data.outgoingOwner,
      incomingOwner: data.incomingOwner
    });

    handoverPackage.rawMarkdown = rawMarkdown;

    const sourceReferences: ISourceReference[] = sources.map((s) => ({
      sourceId: (s as any)._id.toString(),
      title: s.title,
      excerpt: s.originalText.substring(0, 150)
    }));

    // Save ContextTransfer document in MongoDB
    const transferRecord = await ContextTransfer.create({
      projectId: new mongoose.Types.ObjectId(data.projectId),
      transferType: data.transferType,
      outgoingOwner: data.outgoingOwner || null,
      incomingOwner: data.incomingOwner || null,
      period: data.period || null,
      instructions: data.instructions || null,
      selectedSourceIds: data.selectedSourceIds || [],
      selectedTaskIds: data.selectedTaskIds || [],
      generatedContent: handoverPackage,
      sourceReferences,
      generationStatus: 'Completed'
    });

    const transferId = (transferRecord as any)._id.toString();

    await ActivityService.log({
      projectId: data.projectId,
      eventType: 'ContextTransferGenerated',
      entityType: 'ContextTransfer',
      entityId: transferId,
      message: `Generated Context Transfer package (${data.transferType}) for project "${project.name}"`,
      requestId,
      metadata: { transferType: data.transferType, incomingOwner: data.incomingOwner }
    });

    return transferRecord.toObject() as any;
  }

  public static async getProjectTransfers(projectId: string): Promise<IContextTransfer[]> {
    return ContextTransfer.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  public static async getTransferById(transferId: string): Promise<IContextTransfer> {
    const record = await ContextTransfer.findById(transferId).lean();
    if (!record) {
      throw new AppError('Context Transfer record not found', 404);
    }
    return record as any;
  }
}
