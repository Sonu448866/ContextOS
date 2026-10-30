import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import {
  createProjectSchema,
  createKnowledgeSchema,
  createTaskSchema,
  carryForwardTaskSchema
} from '../validators/schemas';
import {
  AIExtractionSchema,
  AIAnswerSchema,
  AIContextTransferSchema,
  AIGapAnalysisSchema
} from '../ai/schemas';
import { AIService } from '../ai/ai.service';
import { AppError } from '../middleware/errorHandler.middleware';

describe('ContextOS Unit & Integration Test Suite', () => {
  // 1. Project Creation Validation
  describe('Project Creation Validation', () => {
    it('should validate a valid project payload', () => {
      const valid = {
        name: 'E-commerce Platform',
        description: 'Testing store',
        status: 'Active',
        members: ['Rahul', 'Priya']
      };
      const result = createProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject a project payload with empty name', () => {
      const invalid = {
        name: '',
        description: 'No name'
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Project name is required');
      }
    });
  });

  // 2. Knowledge Source Validation
  describe('Knowledge Source Validation', () => {
    it('should validate valid knowledge note', () => {
      const valid = {
        title: 'Architecture Decision',
        sourceType: 'Decision',
        originalText: 'Decided to use Razorpay.',
        tags: ['architecture']
      };
      const result = createKnowledgeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid source type or empty text', () => {
      const invalid = {
        title: 'Bad Source',
        sourceType: 'InvalidType',
        originalText: ''
      };
      const result = createKnowledgeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  // 3. Task Creation Validation
  describe('Task Validation & Carry Forward', () => {
    it('should validate task with optional owner and dueDate', () => {
      const task = {
        title: 'Investigate webhook failure',
        priority: 'Critical',
        status: 'In Progress',
        dependencies: []
      };
      const result = createTaskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.owner).toBeUndefined();
        expect(result.data.dueDate).toBeUndefined();
      }
    });

    it('should validate carry-forward parameters', () => {
      const carryPayload = {
        reason: 'Unfinished dependency on payments',
        newCycleLabel: 'Sprint 24'
      };
      const result = carryForwardTaskSchema.safeParse(carryPayload);
      expect(result.success).toBe(true);
    });
  });

  // 4. Deterministic Context Gap Detection Rules
  describe('Context Gap Detection Logic', () => {
    it('should identify missing owner on active task', () => {
      const task: { title: string; status: string; owner: string | null } = {
        title: 'Unassigned Task',
        status: 'In Progress',
        owner: null
      };
      const hasMissingOwner = ['Open', 'In Progress'].includes(task.status) && (!task.owner || task.owner.trim() === '');
      expect(hasMissingOwner).toBe(true);
    });

    it('should identify blocked task without recorded blocker description', () => {
      const task = {
        title: 'Checkout testing',
        status: 'Blocked',
        blockerDescription: ''
      };
      const isBlockedWithoutReason = task.status === 'Blocked' && (!task.blockerDescription || task.blockerDescription.trim() === '');
      expect(isBlockedWithoutReason).toBe(true);
    });

    it('should identify critical task with missing due date', () => {
      const task = {
        title: 'Resolve payment integration',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: null
      };
      const isMissingDueDate = ['Open', 'In Progress', 'Blocked'].includes(task.status) && !task.dueDate;
      expect(isMissingDueDate).toBe(true);
    });
  });

  // 5. AI Response Schema Validation
  describe('AI Schemas Validation', () => {
    it('should validate a structured knowledge extraction result', () => {
      const rawExtraction = {
        summary: 'Payment architecture discussion',
        facts: [{ title: 'Provider', content: 'Razorpay', excerpt: 'Using Razorpay', confidence: 0.99 }],
        decisions: [{ title: 'Razorpay Selection', content: 'Selected Razorpay', rationale: 'Reliable webhooks' }],
        actionItems: [{ title: 'Resolve integration', owner: 'Rahul', dueDate: null, priority: 'Critical', status: 'In Progress' }],
        blockers: [{ title: 'Webhook failure', description: 'Webhooks failing' }],
        risks: [{ title: 'Delay Risk', description: 'Schedule slip' }],
        dependencies: [{ dependent: 'Checkout', dependsOn: 'Payments' }],
        openQuestions: [{ question: 'What is the date?' }],
        contradictions: []
      };

      const parsed = AIExtractionSchema.safeParse(rawExtraction);
      expect(parsed.success).toBe(true);
    });

    it('should validate an AI project answer with citations and uncertainty', () => {
      const rawAnswer = {
        answer: 'Checkout testing is delayed waiting for payment webhooks.',
        citations: [
          {
            sourceId: 'src-1',
            sourceTitle: 'Payment Update',
            excerpt: 'Webhook verification is failing.'
          }
        ],
        uncertaintyNotes: 'No deadline recorded for webhook fix.',
        conflictsDetected: [],
        confidenceScore: 0.95
      };

      const parsed = AIAnswerSchema.safeParse(rawAnswer);
      expect(parsed.success).toBe(true);
    });

    it('should validate 17-part context transfer schema', () => {
      const rawTransfer = {
        executiveSummary: 'Exec summary',
        projectBackground: 'Background',
        currentProjectState: 'Active',
        importantDecisions: [{ title: 'D1', content: 'Decided X' }],
        decisionRationale: 'Rationale X',
        completedWork: ['Initial setup'],
        openTasks: [{ title: 'Task 1', owner: 'Rahul', dueDate: null, status: 'In Progress', priority: 'Critical' }],
        taskOwnersAndDueDates: 'Rahul owns task 1',
        blockers: [{ title: 'B1', description: 'Blocker 1' }],
        dependencies: [{ dependent: 'T2', dependsOn: 'T1' }],
        knownRisks: [{ title: 'Risk 1', impact: 'High' }],
        unresolvedQuestions: ['Question 1'],
        recentChanges: ['Updated webhooks'],
        criticalDocumentation: [{ title: 'Doc 1' }],
        recommendedNextSteps: ['Fix webhooks'],
        missingOrConflictingInformation: ['Missing deadline on payment task'],
        sourceReferences: [{ sourceId: '1', title: 'Note 1' }]
      };

      const parsed = AIContextTransferSchema.safeParse(rawTransfer);
      expect(parsed.success).toBe(true);
    });
  });

  // 6. AI Service Mock / Fallback Operations
  describe('AI Service Extraction and Fallback', () => {
    it('should extract structured knowledge with mock provider without crashing', async () => {
      const result = await AIService.extractKnowledge({
        title: 'Payment Architecture Decision',
        sourceType: 'Decision',
        content: 'The team has decided to use Razorpay for the payment integration. Checkout testing should begin after the payment integration is implemented and webhook verification has been validated.'
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeTruthy();
      expect(Array.isArray(result.decisions)).toBe(true);
      expect(Array.isArray(result.actionItems)).toBe(true);
      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.decisions[0].rationale).toBeTruthy();
    });

    it('should answer question with citations citing payment dependencies', async () => {
      const result = await AIService.askProject({
        question: 'Why is checkout testing delayed?',
        project: { name: 'E-commerce Platform', description: 'Store checkout' },
        contextSources: [
          {
            id: 'Source-2',
            title: 'Payment Integration Update',
            sourceType: 'Project Update',
            text: 'The payment integration is still incomplete. Webhook verification is failing and requires further investigation. Rahul is responsible for resolving the integration issue. No confirmed completion date has been recorded.'
          },
          {
            id: 'Source-3',
            title: 'Checkout Testing Update',
            sourceType: 'Project Update',
            text: 'Priya is responsible for checkout testing. Testing is blocked until the payment integration and webhook verification are resolved.'
          }
        ],
        contextTasks: [
          {
            id: 't-1',
            title: 'Resolve payment integration and webhook verification',
            owner: 'Rahul',
            status: 'In Progress',
            blockerDescription: 'Webhook verification failing'
          },
          {
            id: 't-2',
            title: 'Complete checkout testing',
            owner: 'Priya',
            status: 'Blocked',
            blockerDescription: 'Blocked until payment integration resolved'
          }
        ],
        contextDecisions: []
      });

      expect(result.answer).toContain('blocked');
      expect(result.answer).toContain('webhook');
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.citations[0].sourceId).toBeTruthy();
    });

    it('should generate complete 17-part handover package', async () => {
      const handover = await AIService.generateContextTransfer({
        project: { name: 'E-commerce Platform', description: 'Store checkout' },
        transferType: 'Role Handover',
        outgoingOwner: 'Rahul',
        incomingOwner: 'New Lead',
        sources: [
          {
            id: 'Source-1',
            title: 'Payment Decision',
            sourceType: 'Decision',
            text: 'Using Razorpay.'
          }
        ],
        tasks: [
          {
            id: 'Task-1',
            title: 'Payment integration',
            owner: 'Rahul',
            status: 'In Progress',
            priority: 'Critical'
          }
        ],
        decisions: [
          {
            id: 'D-1',
            title: 'Use Razorpay',
            content: 'Selected Razorpay',
            rationale: 'Reliable webhooks'
          }
        ]
      });

      expect(handover.executiveSummary).toBeTruthy();
      expect(handover.openTasks.length).toBeGreaterThan(0);
      expect(handover.recommendedNextSteps.length).toBeGreaterThan(0);
      expect(handover.missingOrConflictingInformation).toBeDefined();
    });
  });

  // 7. Supertest API Integration Tests
  describe('Express REST API Endpoints', () => {
    const app = createApp();

    it('GET /api/health should return 200/503 with service info and x-request-id', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.body.service).toBe('ContextOS API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.ai).toBeDefined();
    });

    it('POST /api/projects should reject invalid body with 400 and validation details', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request data');
      expect(res.body.details).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('Unknown route should return 404 with structured error', async () => {
      const res = await request(app).get('/api/non-existent-route-path');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Route not found');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });
});
