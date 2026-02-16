import mongoose from 'mongoose';

const contentIndexSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'html', 'xml', 'json', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'],
  },
  content: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
    default: null,
  },
  language: {
    type: String,
    default: 'en',
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  pages: {
    type: Number,
    default: 1,
  },
  keywords: [{
    word: String,
    frequency: Number,
    positions: [Number],
    importance: Number,
  }],
  entities: [{
    text: String,
    type: String,
    confidence: Number,
    position: Number,
  }],
  topics: [{
    topic: String,
    confidence: Number,
    keywords: [String],
  }],
  summary: {
    type: String,
    default: null,
  },
  indexedAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  error: {
    type: String,
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

// Text search index
contentIndexSchema.index({ userId: 1, content: 'text' });
contentIndexSchema.index({ extractedText: 'text' });
contentIndexSchema.index({ keywords: 'text' });
contentIndexSchema.index({ 'entities.text': 'text' });
contentIndexSchema.index({ topics: 'text' });
contentIndexSchema.index({ fileType: 1 });
contentIndexSchema.index({ processingStatus: 1 });
contentIndexSchema.index({ indexedAt: -1 });

export const ContentIndex = mongoose.model('ContentIndex', contentIndexSchema);
