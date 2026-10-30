import { z } from 'zod';

export const AIExtractionSchema = z.object({
  summary: z.string().describe('Concise executive summary of the document'),
  facts: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        confidence: z.number().min(0).max(1).optional()
      })
    )
    .default([]),
  decisions: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        rationale: z.string().optional(),
        excerpt: z.string().optional()
      })
    )
    .default([]),
  actionItems: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        owner: z.string().nullable().optional(),
        dueDate: z.string().nullable().optional(),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
        status: z.enum(['Open', 'In Progress', 'Blocked']).optional().default('Open'),
        dependencies: z.array(z.string()).optional().default([]),
        blockerDescription: z.string().optional(),
        excerpt: z.string().optional(),
        confidence: z.number().min(0).max(1).optional()
      })
    )
    .default([]),
  blockers: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        affectedTask: z.string().optional(),
        excerpt: z.string().optional()
      })
    )
    .default([]),
  risks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        impact: z.string().optional(),
        excerpt: z.string().optional()
      })
    )
    .default([]),
  dependencies: z
    .array(
      z.object({
        dependent: z.string(),
        dependsOn: z.string(),
        excerpt: z.string().optional()
      })
    )
    .default([]),
  openQuestions: z
    .array(
      z.object({
        question: z.string(),
        context: z.string().optional(),
        excerpt: z.string().optional()
      })
    )
    .default([]),
  contradictions: z
    .array(
      z.object({
        issue: z.string(),
        sourceA: z.string().optional(),
        sourceB: z.string().optional(),
        explanation: z.string()
      })
    )
    .default([])
});

export const AIAnswerSchema = z.object({
  answer: z.string(),
  citations: z
    .array(
      z.object({
        sourceId: z.string(),
        sourceTitle: z.string(),
        excerpt: z.string()
      })
    )
    .default([]),
  uncertaintyNotes: z.string().nullable().optional(),
  conflictsDetected: z.array(z.string()).optional().default([]),
  confidenceScore: z.number().min(0).max(1).optional()
});

export const AIContextTransferSchema = z.object({
  executiveSummary: z.string(),
  projectBackground: z.string(),
  currentProjectState: z.string(),
  importantDecisions: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        rationale: z.string().optional()
      })
    )
    .default([]),
  decisionRationale: z.string().default(''),
  completedWork: z.array(z.string()).default([]),
  openTasks: z
    .array(
      z.object({
        title: z.string(),
        owner: z.string().nullable().optional(),
        dueDate: z.string().nullable().optional(),
        status: z.string().default('Open'),
        priority: z.string().default('Medium')
      })
    )
    .default([]),
  taskOwnersAndDueDates: z.string().default(''),
  blockers: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        affectedTask: z.string().optional()
      })
    )
    .default([]),
  dependencies: z
    .array(
      z.object({
        dependent: z.string(),
        dependsOn: z.string()
      })
    )
    .default([]),
  knownRisks: z
    .array(
      z.object({
        title: z.string(),
        impact: z.string().optional()
      })
    )
    .default([]),
  unresolvedQuestions: z.array(z.string()).default([]),
  recentChanges: z.array(z.string()).default([]),
  criticalDocumentation: z
    .array(
      z.object({
        title: z.string(),
        reference: z.string().optional()
      })
    )
    .default([]),
  recommendedNextSteps: z.array(z.string()).default([]),
  missingOrConflictingInformation: z.array(z.string()).default([]),
  sourceReferences: z
    .array(
      z.object({
        sourceId: z.string(),
        title: z.string()
      })
    )
    .default([])
});

export const AIGapAnalysisSchema = z.object({
  detectedGaps: z
    .array(
      z.object({
        gapType: z.enum([
          'MissingOwner',
          'MissingDueDate',
          'BlockedWithoutReason',
          'StaleTask',
          'UnresolvedDependency',
          'MissingRationale',
          'ConflictingDeadline',
          'ConflictingOwner',
          'ConflictingStatus',
          'OmittedOpenTask',
          'OmittedHandoverInfo',
          'UnrepresentedBlocker'
        ]),
        severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
        description: z.string(),
        affectedRecordType: z.enum(['Task', 'Decision', 'Source', 'Handover']),
        affectedRecordId: z.string().nullable().optional(),
        evidence: z.string(),
        recommendedResolution: z.string()
      })
    )
    .default([])
});
