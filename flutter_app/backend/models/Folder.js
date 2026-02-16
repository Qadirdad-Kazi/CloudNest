import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  parentPath: {
    type: String,
    default: '/',
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
folderSchema.index({ userId: 1, parentPath: 1 });
folderSchema.index({ userId: 1, path: 1 }, { unique: true });
folderSchema.index({ userId: 1, isStarred: 1 });
folderSchema.index({ userId: 1, isDeleted: 1 });

// Update lastAccessed timestamp when folder is accessed
folderSchema.methods.updateLastAccessed = function() {
  this.lastAccessed = Date.now();
  return this.save();
};

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;
