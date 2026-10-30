import mongoose, { Document, Schema } from 'mongoose';
import { IKnowledgeSource, KnowledgeSourceType, ProcessingStatus, ExtractionStatus } from '../types/shared';

export interface IKnowledgeSourceDocument extends Omit<IKnowledgeSource, '_id' | 'createdAt' | 'updatedAt' | 'projectId'>, Document {
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeSourceSchema = new Schema<IKnowledgeSourceDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters']
    },
    sourceType: {
      type: String,
      enum: [
        'Meeting Notes',
        'Project Update',
        'Technical Documentation',
        'Decision',
        'Handover',
        'General Note',
        'Imported Document'
      ],
      default: 'General Note',
      index: true
    },
    originalText: {
      type: String,
      required: [true, 'Original text content is required']
    },
    fileMetadata: {
      filename: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      path: { type: String }
    },
    tags: {
      type: [String],
      default: []
    },
    author: {
      type: String,
      default: null
    },
    processingStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Needs Review'],
      default: 'Completed',
      index: true
    },
    extractionStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Needs Review', 'Skipped'],
      default: 'Pending',
      index: true
    },
    extractionError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

KnowledgeSourceSchema.index({ projectId: 1, createdAt: -1 });

export const KnowledgeSource = mongoose.model<IKnowledgeSourceDocument>(
  'KnowledgeSource',
  KnowledgeSourceSchema
);
