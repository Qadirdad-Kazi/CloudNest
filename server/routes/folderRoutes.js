import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { folderService } from '../services/folderService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all folders for the current user at the specified path
router.get('/', async (req, res) => {
  try {
    const { path = '/' } = req.query;
    const userId = req.user._id;
    
    console.log('Getting folders for user:', userId, 'at path:', path);
    
    const folders = await folderService.getFolders(userId, path);
    
    // Transform the database objects to match the expected client format
    const formattedFolders = folders.map(folder => ({
      id: folder._id.toString(),
      name: folder.name,
      path: folder.path,
      parentPath: folder.parentPath,
      createdAt: folder.createdAt.toISOString(),
      modifiedAt: folder.modifiedAt.toISOString(),
      owner: folder.userId.toString(),
      starred: folder.isStarred || false,
      shared: false, // This would need to be determined by checking ShareLinks
      tags: [] // Add empty tags array to match client type
    }));
    
    console.log('Returning formatted folders:', formattedFolders);
    
    res.json(formattedFolders);
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({ message: 'Failed to get folders', error: error.message });
  }
});

// Create a new folder
router.post('/create', async (req, res) => {
  try {
    const { name, path: parentPath = '/' } = req.body;
    const userId = req.user._id;
    
    console.log('Creating folder for user:', userId, { name, parentPath });
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const newFolder = await folderService.createFolder(userId, name, parentPath);

    // Format response to match client expectations
    const folderResponse = {
      id: newFolder._id.toString(),
      name: newFolder.name,
      path: newFolder.path,
      parentPath: newFolder.parentPath,
      createdAt: newFolder.createdAt.toISOString(),
      modifiedAt: newFolder.modifiedAt.toISOString(),
      owner: newFolder.userId.toString(),
      starred: newFolder.isStarred || false,
      shared: false,
      tags: [] // Add empty tags array to match client type
    };

    console.log('Created folder response:', folderResponse);

    res.status(201).json(folderResponse);
  } catch (error) {
    console.error('Error creating folder:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to create folder' });
  }
});

// Delete a folder
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await folderService.deleteFolder(userId, id);
    
    res.json({ message: 'Folder deleted successfully', folderId: id });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: error.message || 'Failed to delete folder' });
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

    const updatedFolder = await folderService.renameFolder(userId, id, newName);
    
    res.json({
      message: 'Folder renamed successfully',
      folder: {
        id: updatedFolder._id,
        name: updatedFolder.name,
        path: updatedFolder.path,
        createdAt: updatedFolder.createdAt,
        modifiedAt: updatedFolder.modifiedAt,
        owner: updatedFolder.userId,
        starred: updatedFolder.isStarred,
        shared: false
      }
    });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ message: error.message || 'Failed to rename folder' });
  }
});

// Star/unstar a folder
router.patch('/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const updatedFolder = await folderService.toggleStar(userId, id);
    
    // Return complete folder data with consistent format
    res.json({
      id: updatedFolder._id.toString(),
      name: updatedFolder.name,
      path: updatedFolder.path,
      parentPath: updatedFolder.parentPath,
      createdAt: updatedFolder.createdAt.toISOString(),
      modifiedAt: updatedFolder.modifiedAt.toISOString(),
      owner: updatedFolder.userId.toString(),
      starred: updatedFolder.isStarred,
      shared: false,
      tags: []
    });
  } catch (error) {
    console.error('Error updating star status:', error);
    res.status(500).json({ message: error.message || 'Failed to update star status' });
  }
});

export default router;
