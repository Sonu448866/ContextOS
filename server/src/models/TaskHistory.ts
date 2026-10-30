import mongoose, { Document, Schema } from 'mongoose';
import { ITaskHistory, TaskEventType } from '../types/shared';

export interface ITaskHistoryDocument
  extends Omit<ITaskHistory, '_id' | 'createdAt' | 'taskId' | 'projectId'>,
    Document {
  taskId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TaskHistorySchema = new Schema<ITaskHistoryDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: [
        'Created',
        'OwnerAssigned',
        'OwnerChanged',
        'DueDateChanged',
        'StatusChanged',
        'BlockerAdded',
        'BlockerResolved',
        'Completed',
        'Reopened',
        'CarriedForward',
        'Edited'
      ],
      required: true,
      index: true
    },
    previousValue: {
      type: String,
      default: null
    },
    newValue: {
      type: String,
      default: null
    },
    actor: {
      type: String,
      default: 'System User'
    },
    sourceId: {
      type: String,
      default: null
    },
    contextTransferId: {
      type: String,
      default: null
    },
    requestId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

TaskHistorySchema.index({ taskId: 1, createdAt: -1 });
TaskHistorySchema.index({ projectId: 1, createdAt: -1 });

export const TaskHistory = mongoose.model<ITaskHistoryDocument>('TaskHistory', TaskHistorySchema);
