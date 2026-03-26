import mongoose, { Document, Schema, Types } from 'mongoose';

export type LeadSource = 'website' | 'referral' | 'cold' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      match: [/^[0-9+\-()\s]{7,20}$/, 'Please provide a valid phone number'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
      sparse: true,
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'cold', 'other'],
      required: [true, 'Source is required'],
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'won', 'lost'],
      default: 'new',
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Single-field indexes
leadSchema.index({ createdBy: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });

// Compound index for list API
leadSchema.index({ status: 1, source: 1, createdAt: -1 });

export const LeadModel = mongoose.model<ILead>('Lead', leadSchema);