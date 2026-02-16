import mongoose from 'mongoose';

const imageMetadataSchema = new mongoose.Schema({
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
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    required: true,
    enum: ['JPEG', 'PNG', 'GIF', 'WebP', 'BMP', 'TIFF'],
  },
  colorProfile: {
    type: String,
    default: 'sRGB',
  },
  dominantColors: [{
    color: String,
    percentage: Number,
  }],
  objects: [{
    label: String,
    confidence: Number,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
  }],
  faces: [{
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
    confidence: Number,
    age: String,
    gender: String,
    expression: String,
  }],
  landmarks: [{
    label: String,
    confidence: Number,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
  }],
  text: [{
    content: String,
    confidence: Number,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
  }],
  quality: {
    sharpness: Number,
    brightness: Number,
    contrast: Number,
    saturation: Number,
    noise: Number,
    blur: Number,
  },
  tags: [{
    tag: String,
    confidence: Number,
    source: String, // 'ai' or 'manual'
  }],
  autoTags: [{
    tag: String,
    confidence: Number,
    model: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  processedAt: {
    type: Date,
    default: Date.now,
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
imageMetadataSchema.index({ userId: 1 });
imageMetadataSchema.index({ fileId: 1 });
imageMetadataSchema.index({ 'tags.tag': 1 });
imageMetadataSchema.index({ 'autoTags.tag': 1 });
imageMetadataSchema.index({ processedAt: -1 });

export const ImageMetadata = mongoose.model('ImageMetadata', imageMetadataSchema);
