import mongoose, { Document, Schema } from 'mongoose';
import { ITask, TaskPriority, TaskStatus, ISourceReference } from '../types/shared';

export interface ITaskDocument
  extends Omit<ITask, '_id' | 'createdAt' | 'updatedAt' | 'projectId'>,
    Document {
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SourceReferenceSchema = new Schema<ISourceReference>(
  {
    sourceId: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: '' }
  },
  { _id: false }
);

const TaskSchema = new Schema<ITaskDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [300, 'Task title cannot exceed 300 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    owner: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    dueDate: {
      type: String,
      default: null,
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
      default: 'Open',
      index: true
    },
    dependencies: {
      type: [String],
      default: []
    },
    blockerDescription: {
      type: String,
      default: null,
      trim: true
    },
    sourceReferences: {
      type: [SourceReferenceSchema],
      default: []
    },
    relatedDecisionIds: {
      type: [String],
      default: []
    },
    carriedForwardFromId: {
      type: String,
      default: null
    },
    carriedForwardCount: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, owner: 1 });
TaskSchema.index({ projectId: 1, dueDate: 1 });

export const Task = mongoose.model<ITaskDocument>('Task', TaskSchema);
