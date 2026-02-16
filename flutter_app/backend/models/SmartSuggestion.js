import mongoose from 'mongoose';

const smartSuggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  suggestionType: {
    type: String,
    required: true,
    enum: ['related_files', 'similar_content', 'recent_access', 'frequent_access', 'collaborative', 'trending', 'personalized'],
  },
  sourceFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  suggestedFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  reason: {
    type: String,
    required: true,
  },
  factors: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  userAction: {
    type: String,
    enum: ['viewed', 'accepted', 'dismissed', 'ignored'],
    default: null,
  },
  feedback: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
smartSuggestionSchema.index({ userId: 1, suggestionType: 1 });
smartSuggestionSchema.index({ sourceFileId: 1 });
smartSuggestionSchema.index({ suggestedFileId: 1 });
smartSuggestionSchema.index({ score: -1 });
smartSuggestionSchema.index({ isActive: 1, expiresAt: 1 });
smartSuggestionSchema.index({ createdAt: -1 });

export const SmartSuggestion = mongoose.model('SmartSuggestion', smartSuggestionSchema);
