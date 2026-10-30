import mongoose, { Document, Schema } from 'mongoose';
import { IActivityEvent, ActivityEventType } from '../types/shared';

export interface IActivityEventDocument
  extends Omit<IActivityEvent, '_id' | 'createdAt' | 'projectId'>,
    Document {
  projectId: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const ActivityEventSchema = new Schema<IActivityEventDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      default: null,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    requestId: {
      type: String,
      default: null
    },
    outcome: {
      type: String,
      enum: ['Success', 'Failure', 'Warning'],
      default: 'Success',
      index: true
    },
    actor: {
      type: String,
      default: 'System User'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

ActivityEventSchema.index({ projectId: 1, createdAt: -1 });
ActivityEventSchema.index({ eventType: 1, createdAt: -1 });

export const ActivityEvent = mongoose.model<IActivityEventDocument>(
  'ActivityEvent',
  ActivityEventSchema
);
