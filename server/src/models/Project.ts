import mongoose, { Document, Schema } from 'mongoose';
import { IProject, ProjectStatus } from '../types/shared';

export interface IProjectDocument extends Omit<IProject, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Active',
      index: true
    },
    members: {
      type: [String],
      default: []
    },
    startDate: {
      type: String,
      default: null
    },
    targetDate: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

ProjectSchema.index({ status: 1, updatedAt: -1 });

export const Project = mongoose.model<IProjectDocument>('Project', ProjectSchema);
