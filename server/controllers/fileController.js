const File = require('../models/File');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// File type categories and their corresponding MIME types
const fileCategories = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/midi'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar'],
  code: [
    'text/javascript',
    'application/json',
    'text/html',
    'text/css',
    'text/xml',
    'application/x-httpd-php',
    'text/x-python',
    'text/x-java',
  ]
};

// Get category for a file type
const getFileCategory = (mimeType) => {
  for (const [category, types] of Object.entries(fileCategories)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'others';
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const file = req.files.file;
    const userId = req.user._id;
    let parentPath = req.body.parentPath || '/';
    
    // Determine file category and set appropriate parent path
    const category = getFileCategory(file.mimetype);
    if (parentPath === '/') {
      parentPath = `/${category}`;
      // Create category directory if it doesn't exist
      await fs.mkdir(path.join(uploadsDir, category), { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadsDir, category, uniqueFilename);

    // Move file to appropriate directory
    await file.mv(filePath);

    // Create file document in MongoDB
    const fileDoc = new File({
      userId,
      name: file.name,
      type: file.mimetype,
      size: file.size,
      path: path.join(category, uniqueFilename),
      parentPath,
      category
    });

    await fileDoc.save();

    res.status(201).json(fileDoc);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const parentPath = req.query.path || '/';

    const files = await File.find({ 
      userId, 
      parentPath,
      isDeleted: false 
    }).sort({ isStarred: -1, name: 1 });

    // Update lastAccessed for each file
    await Promise.all(files.map(file => file.updateLastAccessed()));

    res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
};

exports.getRecentFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7; // Default to last 7 days

    const files = await File.find({
      userId,
      isDeleted: false,
      lastAccessed: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    })
    .sort({ lastAccessed: -1 })
    .limit(100); // Limit to last 100 files

    res.json(files);
  } catch (error) {
    console.error('Error getting recent files:', error);
    res.status(500).json({ message: 'Failed to get recent files' });
  }
};

exports.getTrashFiles = async (req, res) => {
  try {
    const userId = req.user._id;

    const files = await File.find({
      userId,
      isDeleted: true
    })
    .sort({ deletedAt: -1 });

    res.json(files);
  } catch (error) {
    console.error('Error getting trash files:', error);
    res.status(500).json({ message: 'Failed to get trash files' });
  }
};

exports.moveToTrash = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user._id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({ message: 'File moved to trash successfully' });
  } catch (error) {
    console.error('Error moving file to trash:', error);
    res.status(500).json({ message: 'Failed to move file to trash' });
  }
};

exports.restoreFromTrash = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user._id;

    const file = await File.findOne({ _id: fileId, userId, isDeleted: true });
    if (!file) {
      return res.status(404).json({ message: 'File not found in trash' });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json({ message: 'File restored successfully' });
  } catch (error) {
    console.error('Error restoring file:', error);
    res.status(500).json({ message: 'Failed to restore file' });
  }
};

exports.emptyTrash = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all files in trash
    const trashedFiles = await File.find({ userId, isDeleted: true });

    // Delete files from filesystem
    await Promise.all(trashedFiles.map(file => 
      fs.unlink(path.join(uploadsDir, file.path))
    ));

    // Delete files from database
    await File.deleteMany({ userId, isDeleted: true });

    res.json({ message: 'Trash emptied successfully' });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ message: 'Failed to empty trash' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user._id;
    const skipTrash = req.query.skipTrash === 'true';

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (skipTrash) {
      // Delete file from filesystem
      await fs.unlink(path.join(uploadsDir, file.path));
      // Delete file document
      await file.remove();
      res.json({ message: 'File permanently deleted' });
    } else {
      // Move to trash
      file.isDeleted = true;
      file.deletedAt = new Date();
      await file.save();
      res.json({ message: 'File moved to trash' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};

exports.starFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user._id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.isStarred = !file.isStarred;
    await file.save();

    res.json(file);
  } catch (error) {
    console.error('Error starring file:', error);
    res.status(500).json({ message: 'Failed to star file' });
  }
}; 