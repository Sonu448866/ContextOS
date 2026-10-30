import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { KnowledgeRecord } from '../models/KnowledgeRecord';
import { Task } from '../models/Task';
import { TaskHistory } from '../models/TaskHistory';
import { ContextGap } from '../models/ContextGap';
import { ContextTransfer } from '../models/ContextTransfer';
import { ActivityEvent } from '../models/ActivityEvent';
import { ContextGapService } from './contextGap.service';
import { ActivityService } from './activity.service';
import { logger } from '../config/logger';

export class SeedService {
  public static async seedDemoProject(force: boolean = false): Promise<{ projectId: string; message: string }> {
    const existing = await Project.findOne({ name: 'E-commerce Platform' });

    if (existing && !force) {
      logger.info('Demo project "E-commerce Platform" already exists. Skipping seed.');
      return {
        projectId: (existing as any)._id.toString(),
        message: 'Demo project already exists. Set force=true to re-seed.'
      };
    }

    if (existing && force) {
      logger.info('Force re-seeding demo project "E-commerce Platform". Cleaning existing records...');
      const pId = existing._id;
      await Promise.all([
        Project.deleteOne({ _id: pId }),
        KnowledgeSource.deleteMany({ projectId: pId }),
        KnowledgeRecord.deleteMany({ projectId: pId }),
        Task.deleteMany({ projectId: pId }),
        TaskHistory.deleteMany({ projectId: pId }),
        ContextGap.deleteMany({ projectId: pId }),
        ContextTransfer.deleteMany({ projectId: pId }),
        ActivityEvent.deleteMany({ projectId: pId })
      ]);
    }

    logger.info('Seeding demonstration project: E-commerce Platform');

    // 1. Create Project
    const project = await Project.create({
      name: 'E-commerce Platform',
      description:
        'Next-generation customer checkout, product catalog, payment processing, and order fulfillment platform.',
      status: 'Active',
      members: ['Rahul Sharma', 'Priya Patel', 'Ankit Verma', 'Sneha Roy'],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const projectId = (project as any)._id.toString();

    // 2. Create Knowledge Sources
    const source1 = await KnowledgeSource.create({
      projectId: project._id,
      title: 'Payment Architecture Decision',
      sourceType: 'Decision',
      originalText:
        'The team has decided to use Razorpay for the payment integration. Checkout testing should begin after the payment integration is implemented and webhook verification has been validated. The purpose of webhook verification is to ensure that payment status updates are handled reliably.',
      tags: ['Architecture', 'Payments', 'Razorpay', 'Webhooks'],
      author: 'Ankit Verma',
      processingStatus: 'Completed',
      extractionStatus: 'Completed'
    });

    const source2 = await KnowledgeSource.create({
      projectId: project._id,
      title: 'Payment Integration Update',
      sourceType: 'Project Update',
      originalText:
        'The payment integration is still incomplete. Webhook verification is failing and requires further investigation. Rahul is responsible for resolving the integration issue. No confirmed completion date has been recorded.',
      tags: ['Payments', 'Integration', 'Blocker', 'Webhooks'],
      author: 'Rahul Sharma',
      processingStatus: 'Completed',
      extractionStatus: 'Completed'
    });

    const source3 = await KnowledgeSource.create({
      projectId: project._id,
      title: 'Checkout Testing Update',
      sourceType: 'Project Update',
      originalText:
        'Priya is responsible for checkout testing. Testing is blocked until the payment integration and webhook verification are resolved. Priya will prepare the checkout testing report after the tests are completed.',
      tags: ['Testing', 'QA', 'Checkout', 'Blocker'],
      author: 'Priya Patel',
      processingStatus: 'Completed',
      extractionStatus: 'Completed'
    });

    const source4 = await KnowledgeSource.create({
      projectId: project._id,
      title: 'General Project Handover',
      sourceType: 'Handover',
      originalText:
        'The next person taking over the payment work needs to review the Razorpay integration, investigate the webhook verification failure, confirm the integration\'s readiness, and coordinate with Priya before checkout testing starts. The team should confirm the completion date because no confirmed deadline is currently recorded.',
      tags: ['Handover', 'Context Transfer', 'Payments'],
      author: 'Sneha Roy',
      processingStatus: 'Completed',
      extractionStatus: 'Completed'
    });

    // 3. Create Decisions (KnowledgeRecords)
    const decisionRecord = await KnowledgeRecord.create({
      projectId: project._id,
      sourceId: source1._id,
      recordType: 'Decision',
      title: 'Use Razorpay for payment integration',
      content:
        'Adopt Razorpay as primary payment gateway for checkout processing, relying on webhooks for order status callbacks.',
      structuredData: {
        provider: 'Razorpay',
        rationale:
          'Ensures reliable payment status updates once webhook verification is validated.'
      },
      evidence:
        'The team has decided to use Razorpay for the payment integration. Checkout testing should begin after the payment integration is implemented and webhook verification has been validated.',
      confidence: 1.0,
      reviewStatus: 'Approved'
    });

    // 4. Create First-Class Tasks with Real History
    const task1 = await Task.create({
      projectId: project._id,
      title: 'Resolve payment integration and webhook verification',
      description:
        'Investigate failing webhook signature verification and complete Razorpay integration to enable checkout testing.',
      owner: 'Rahul Sharma',
      dueDate: null, // intentionally null as specified in scenario!
      priority: 'Critical',
      status: 'In Progress',
      dependencies: [],
      blockerDescription: 'Webhook verification is failing and requires further investigation.',
      sourceReferences: [
        {
          sourceId: (source2 as any)._id.toString(),
          title: source2.title,
          excerpt:
            'The payment integration is still incomplete. Webhook verification is failing and requires further investigation.'
        }
      ],
      relatedDecisionIds: [(decisionRecord as any)._id.toString()],
      carriedForwardCount: 0
    });

    const task2 = await Task.create({
      projectId: project._id,
      title: 'Complete checkout testing',
      description:
        'Execute comprehensive checkout flow testing across standard card, UPI, and netbanking methods once payment gateway and webhooks are validated.',
      owner: 'Priya Patel',
      dueDate: null,
      priority: 'High',
      status: 'Blocked',
      dependencies: ['Resolve payment integration and webhook verification'],
      blockerDescription:
        'Testing is blocked until the payment integration and webhook verification are resolved.',
      sourceReferences: [
        {
          sourceId: (source3 as any)._id.toString(),
          title: source3.title,
          excerpt:
            'Testing is blocked until the payment integration and webhook verification are resolved.'
        }
      ],
      relatedDecisionIds: [],
      carriedForwardCount: 0
    });

    const task3 = await Task.create({
      projectId: project._id,
      title: 'Prepare checkout testing report',
      description:
        'Prepare detailed test execution and edge case summary report after checkout testing completes.',
      owner: 'Priya Patel',
      dueDate: null,
      priority: 'Medium',
      status: 'Open',
      dependencies: ['Complete checkout testing'],
      blockerDescription: null,
      sourceReferences: [
        {
          sourceId: (source3 as any)._id.toString(),
          title: source3.title,
          excerpt: 'Priya will prepare the checkout testing report after the tests are completed.'
        }
      ],
      relatedDecisionIds: [],
      carriedForwardCount: 0
    });

    // 5. Create Task History entries
    const t1Id = (task1 as any)._id;
    const t2Id = (task2 as any)._id;
    const t3Id = (task3 as any)._id;

    await TaskHistory.create([
      {
        taskId: t1Id,
        projectId: project._id,
        eventType: 'Created',
        newValue: 'Task created from Payment Architecture Decision',
        actor: 'Ankit Verma'
      },
      {
        taskId: t1Id,
        projectId: project._id,
        eventType: 'OwnerAssigned',
        previousValue: 'None',
        newValue: 'Rahul Sharma',
        actor: 'Ankit Verma'
      },
      {
        taskId: t1Id,
        projectId: project._id,
        eventType: 'StatusChanged',
        previousValue: 'Open',
        newValue: 'In Progress',
        actor: 'Rahul Sharma'
      },
      {
        taskId: t1Id,
        projectId: project._id,
        eventType: 'BlockerAdded',
        previousValue: 'None',
        newValue: 'Webhook verification is failing and requires further investigation.',
        actor: 'Rahul Sharma'
      },
      {
        taskId: t2Id,
        projectId: project._id,
        eventType: 'Created',
        newValue: 'Task created for QA checkout verification',
        actor: 'Priya Patel'
      },
      {
        taskId: t2Id,
        projectId: project._id,
        eventType: 'StatusChanged',
        previousValue: 'Open',
        newValue: 'Blocked',
        actor: 'Priya Patel'
      },
      {
        taskId: t2Id,
        projectId: project._id,
        eventType: 'BlockerAdded',
        previousValue: 'None',
        newValue: 'Testing is blocked until payment integration and webhook verification are resolved.',
        actor: 'Priya Patel'
      },
      {
        taskId: t3Id,
        projectId: project._id,
        eventType: 'Created',
        newValue: 'Task created for final checkout testing signoff report',
        actor: 'Priya Patel'
      }
    ]);

    // 6. Run ContextGapService to detect realistic context gaps
    await ContextGapService.analyzeProjectGaps(projectId);

    // 7. Seed initial ActivityEvents
    await ActivityService.log({
      projectId,
      eventType: 'ProjectCreated',
      entityType: 'Project',
      entityId: projectId,
      message: 'Initialized project "E-commerce Platform"'
    });

    await ActivityService.log({
      projectId,
      eventType: 'KnowledgeAdded',
      entityType: 'KnowledgeSource',
      entityId: (source1 as any)._id.toString(),
      message: 'Added knowledge source "Payment Architecture Decision"'
    });

    await ActivityService.log({
      projectId,
      eventType: 'TaskCreated',
      entityType: 'Task',
      entityId: t1Id.toString(),
      message: 'Created task "Resolve payment integration and webhook verification"'
    });

    await ActivityService.log({
      projectId,
      eventType: 'TaskStatusChanged',
      entityType: 'Task',
      entityId: t2Id.toString(),
      message: 'Task "Complete checkout testing" marked as Blocked'
    });

    logger.info({ projectId }, 'Demo project "E-commerce Platform" seeded successfully');

    return {
      projectId,
      message: 'Successfully seeded "E-commerce Platform" demonstration scenario.'
    };
  }
}
