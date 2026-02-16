import mongoose from 'mongoose';

const shareLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
});

// Validate that either fileId or folderId is provided
shareLinkSchema.pre('validate', function(next) {
  if (!this.fileId && !this.folderId) {
    next(new Error('Either fileId or folderId must be provided'));
  } else if (this.fileId && this.folderId) {
    next(new Error('Only one of fileId or folderId should be provided'));
  } else {
    next();
  }
});

// Increment access count
shareLinkSchema.methods.incrementAccessCount = function() {
  this.accessCount += 1;
  return this.save();
};

export default mongoose.model('ShareLink', shareLinkSchema);
