import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().optional().default(''),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).optional().default('Active'),
  members: z.array(z.string()).optional().default([]),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).optional(),
  members: z.array(z.string()).optional(),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional()
});

export const createKnowledgeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  sourceType: z.enum([
    'Meeting Notes',
    'Project Update',
    'Technical Documentation',
    'Decision',
    'Handover',
    'General Note',
    'Imported Document'
  ]),
  originalText: z.string().min(1, 'Content cannot be empty'),
  tags: z.array(z.string()).optional().default([]),
  author: z.string().nullable().optional()
});

export const commitExtractionSchema = z.object({
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
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
        status: z.enum(['Open', 'In Progress', 'Blocked']).optional(),
        blockerDescription: z.string().optional(),
        dependencies: z.array(z.string()).optional()
      })
    )
    .default([]),
  facts: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        excerpt: z.string().optional()
      })
    )
    .optional()
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().optional().default(''),
  owner: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
  status: z.enum(['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled']).optional().default('Open'),
  dependencies: z.array(z.string()).optional().default([]),
  blockerDescription: z.string().nullable().optional(),
  relatedDecisionIds: z.array(z.string()).optional().default([])
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  owner: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.enum(['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled']).optional(),
  dependencies: z.array(z.string()).optional(),
  blockerDescription: z.string().nullable().optional()
});

export const carryForwardTaskSchema = z.object({
  reason: z.string().optional(),
  newCycleLabel: z.string().optional()
});

export const askQuestionSchema = z.object({
  question: z.string().min(2, 'Question must be at least 2 characters')
});

export const generateTransferSchema = z.object({
  transferType: z.enum([
    'Full Project',
    'Workstream',
    'Task Set',
    'Role Handover',
    'New Member Onboarding',
    'Meeting Catchup'
  ]),
  outgoingOwner: z.string().nullable().optional(),
  incomingOwner: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  selectedSourceIds: z.array(z.string()).optional().default([]),
  selectedTaskIds: z.array(z.string()).optional().default([])
});

export const updateGapStatusSchema = z.object({
  status: z.enum(['Open', 'Acknowledged', 'Resolved', 'Dismissed'])
});
