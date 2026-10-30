import { ActivityEvent } from '../models/ActivityEvent';
import { ActivityEventType } from '../types/shared';
import { logger } from '../config/logger';

export interface LogActivityParams {
  projectId?: string | null;
  eventType: ActivityEventType;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, any>;
  requestId?: string | null;
  outcome?: 'Success' | 'Failure' | 'Warning';
  actor?: string;
}

export class ActivityService {
  public static async log(params: LogActivityParams): Promise<void> {
    try {
      const outcome = params.outcome || 'Success';

      // 1. Structured log output via Pino
      logger.info(
        {
          activity: {
            eventType: params.eventType,
            entityType: params.entityType,
            entityId: params.entityId,
            projectId: params.projectId,
            outcome,
            requestId: params.requestId,
            metadata: params.metadata
          }
        },
        `[Activity] ${params.message}`
      );

      // 2. Persist to MongoDB
      await ActivityEvent.create({
        projectId: params.projectId || null,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId || null,
        message: params.message,
        metadata: params.metadata || {},
        requestId: params.requestId || null,
        outcome,
        actor: params.actor || 'System User'
      });
    } catch (err) {
      logger.error({ err, activity: params }, 'Failed to persist activity event');
    }
  }

  public static async list(filters: {
    projectId?: string;
    eventType?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: Record<string, any> = {};

    if (filters.projectId) {
      query.projectId = filters.projectId;
    }
    if (filters.eventType) {
      query.eventType = filters.eventType;
    }
    if (filters.outcome) {
      query.outcome = filters.outcome;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const limit = Math.min(filters.limit || 50, 100);
    const skip = filters.skip || 0;

    const [events, total] = await Promise.all([
      ActivityEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityEvent.countDocuments(query)
    ]);

    return {
      events,
      total,
      limit,
      skip
    };
  }
}
