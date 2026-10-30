import mongoose, { Document, Schema } from 'mongoose';
import { IContextGap, GapType, GapSeverity, GapStatus, DetectionMethod } from '../types/shared';

export interface IContextGapDocument
  extends Omit<IContextGap, '_id' | 'createdAt' | 'updatedAt' | 'projectId'>,
    Document {
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContextGapSchema = new Schema<IContextGapDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    gapType: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },
    description: {
      type: String,
      required: true
    },
    affectedRecordType: {
      type: String,
      enum: ['Task', 'Decision', 'Source', 'Handover'],
      required: true
    },
    affectedRecordId: {
      type: String,
      default: null,
      index: true
    },
    evidence: {
      type: String,
      default: ''
    },
    recommendedResolution: {
      type: String,
      default: ''
    },
    detectionMethod: {
      type: String,
      enum: ['Deterministic', 'AI-Assisted'],
      default: 'Deterministic',
      index: true
    },
    status: {
      type: String,
      enum: ['Open', 'Acknowledged', 'Resolved', 'Dismissed'],
      default: 'Open',
      index: true
    },
    detectedAt: {
      type: String,
      required: true
    },
    resolvedAt: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

ContextGapSchema.index({ projectId: 1, status: 1 });
ContextGapSchema.index({ projectId: 1, severity: 1 });

export const ContextGap = mongoose.model<IContextGapDocument>('ContextGap', ContextGapSchema);
