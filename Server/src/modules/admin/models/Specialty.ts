import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialty extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialtySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
SpecialtySchema.index({ name: 'text', description: 'text' });

export default mongoose.model<ISpecialty>('Specialty', SpecialtySchema);
