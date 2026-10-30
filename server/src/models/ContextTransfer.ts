import mongoose, { Document, Schema } from 'mongoose';
import { IContextTransfer, TransferType, ISourceReference } from '../types/shared';

export interface IContextTransferDocument
  extends Omit<IContextTransfer, '_id' | 'createdAt' | 'updatedAt' | 'projectId'>,
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

const ContextTransferSchema = new Schema<IContextTransferDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    transferType: {
      type: String,
      enum: [
        'Full Project',
        'Workstream',
        'Task Set',
        'Role Handover',
        'New Member Onboarding',
        'Meeting Catchup'
      ],
      default: 'Full Project',
      index: true
    },
    outgoingOwner: {
      type: String,
      default: null
    },
    incomingOwner: {
      type: String,
      default: null
    },
    period: {
      type: String,
      default: null
    },
    instructions: {
      type: String,
      default: null
    },
    selectedSourceIds: {
      type: [String],
      default: []
    },
    selectedTaskIds: {
      type: [String],
      default: []
    },
    generatedContent: {
      type: Schema.Types.Mixed,
      required: true
    },
    sourceReferences: {
      type: [SourceReferenceSchema],
      default: []
    },
    generationStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Completed'
    }
  },
  {
    timestamps: true
  }
);

ContextTransferSchema.index({ projectId: 1, createdAt: -1 });

export const ContextTransfer = mongoose.model<IContextTransferDocument>(
  'ContextTransfer',
  ContextTransferSchema
);
