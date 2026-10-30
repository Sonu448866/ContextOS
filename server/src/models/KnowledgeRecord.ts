import mongoose, { Document, Schema } from 'mongoose';
import { IKnowledgeRecord, KnowledgeRecordType } from '../types/shared';

export interface IKnowledgeRecordDocument
  extends Omit<IKnowledgeRecord, '_id' | 'createdAt' | 'updatedAt' | 'projectId' | 'sourceId'>,
    Document {
  projectId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeRecordSchema = new Schema<IKnowledgeRecordDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeSource',
      required: true,
      index: true
    },
    recordType: {
      type: String,
      enum: ['Fact', 'Decision', 'Risk', 'Blocker', 'Question', 'Contradiction'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    structuredData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    evidence: {
      type: String,
      default: ''
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    reviewStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
      index: true
    }
  },
  {
    timestamps: true
  }
);

KnowledgeRecordSchema.index({ projectId: 1, recordType: 1 });

export const KnowledgeRecord = mongoose.model<IKnowledgeRecordDocument>(
  'KnowledgeRecord',
  KnowledgeRecordSchema
);
