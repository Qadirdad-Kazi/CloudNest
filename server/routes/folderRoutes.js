import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import Folder from '../models/Folder.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all folders for the current user at the specified path
router.get('/', async (req, res) => {
  try {
    const { path = '/' } = req.query;
    const userId = req.user._id;
    
    // Query the database for folders that match the path and aren't deleted
    const folders = await Folder.find({
      userId,
      parentPath: path,
      isDeleted: false
    }).sort({ modifiedAt: -1 });
    
    // Transform the database objects to match the expected client format
    const formattedFolders = folders.map(folder => ({
      id: folder._id,
      name: folder.name,
      path: folder.path,
      createdAt: folder.createdAt,
      modifiedAt: folder.modifiedAt,
      owner: folder.userId,
      starred: folder.isStarred,
      shared: false // This would need to be determined by checking ShareLinks
    }));
    
    res.json(formattedFolders);
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({ message: 'Failed to get folders' });
  }
});

// Create a new folder
router.post('/create', async (req, res) => {
  try {
    const { name, path: parentPath = '/' } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // Create the full path for the folder
    const folderPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    
    // Check if folder already exists at this path
    const existingFolder = await Folder.findOne({
      userId: req.user._id,
      path: folderPath,
      isDeleted: false
    });
    
    if (existingFolder) {
      return res.status(400).json({ message: 'A folder with this name already exists in this location' });
    }

    // Create new folder in database
    const newFolder = new Folder({
      userId: req.user._id,
      name,
      path: folderPath,
      parentPath
    });

    await newFolder.save();

    // Format response to match client expectations
    const folderResponse = {
      id: newFolder._id,
      name: newFolder.name,
      path: newFolder.path,
      createdAt: newFolder.createdAt,
      modifiedAt: newFolder.modifiedAt,
      owner: newFolder.userId,
      starred: newFolder.isStarred,
      shared: false
    };

    res.status(201).json(folderResponse);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Failed to create folder' });
  }
});

// Delete a folder
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the folder
    const folder = await Folder.findOne({ _id: id, userId });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Delete the folder
    await Folder.deleteOne({ _id: id, userId });
    
    // In a production environment, you would also delete all files and subfolders
    // This would involve finding all files with parentPath starting with folder.path
    // and deleting them as well
    
    res.json({ message: 'Folder deleted successfully', folderId: id });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Failed to delete folder' });
  }
});

// Rename a folder
router.patch('/:id/rename', async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const userId = req.user._id;

    if (!newName) {
      return res.status(400).json({ message: 'New folder name is required' });
    }

    // Find the folder
    const folder = await Folder.findOne({ _id: id, userId });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check if a folder with the new name already exists at the same level
    const existingFolder = await Folder.findOne({
      userId,
      parentPath: folder.parentPath,
      name: newName,
      _id: { $ne: id } // Not the current folder
    });
    
    if (existingFolder) {
      return res.status(400).json({ message: 'A folder with this name already exists in this location' });
    }
    
    // Update the folder name and path
    const oldPath = folder.path;
    const newPath = folder.parentPath === '/' ? `/${newName}` : `${folder.parentPath}/${newName}`;
    
    folder.name = newName;
    folder.path = newPath;
    folder.modifiedAt = new Date();
    
    await folder.save();
    
    // In a production environment, you would also update all files and subfolders
    // that have paths starting with the old path to use the new path
    
    res.json({
      message: 'Folder renamed successfully',
      folder: {
        id: folder._id,
        name: folder.name,
        path: folder.path,
        createdAt: folder.createdAt,
        modifiedAt: folder.modifiedAt,
        owner: folder.userId,
        starred: folder.isStarred,
        shared: false
      }
    });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ message: 'Failed to rename folder' });
  }
});

// Star/unstar a folder
router.patch('/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would toggle the starred status in the database
    
    res.json({
      id,
      starred: true, // Toggle this based on current state in a real implementation
      // Include other folder properties
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating star status:', error);
    res.status(500).json({ message: 'Failed to update star status' });
  }
});

export default router;
