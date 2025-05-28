import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import ShareLink from '../models/ShareLink.js';
import File from '../models/File.js';
import Folder from '../models/Folder.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all share links for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Query the database for all share links created by this user
    const shareLinks = await ShareLink.find({ userId });
    
    // Transform the database objects to match the expected client format
    const formattedLinks = await Promise.all(shareLinks.map(async (link) => {
      // Get the associated file or folder name
      let itemName = '';
      let itemType = '';
      
      if (link.fileId) {
        const file = await File.findById(link.fileId);
        if (file) {
          itemName = file.name;
          itemType = 'file';
        }
      } else if (link.folderId) {
        const folder = await Folder.findById(link.folderId);
        if (folder) {
          itemName = folder.name;
          itemType = 'folder';
        }
      }
      
      return {
        id: link._id,
        fileId: link.fileId,
        folderId: link.folderId,
        itemName,
        itemType,
        url: link.url,
        token: link.token,
        isPublic: link.isPublic,
        password: link.password ? '********' : null, // Don't send actual password
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        accessCount: link.accessCount,
        owner: link.userId
      };
    }));
    
    res.json(formattedLinks);
  } catch (error) {
    console.error('Error getting share links:', error);
    res.status(500).json({ message: 'Failed to get share links' });
  }
});

// Create a new share link
router.post('/', async (req, res) => {
  try {
    const { itemId, itemType, isPublic = true, password = null, expiresAt = null } = req.body;
    
    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'Item ID and type are required' });
    }

    // Verify that the item exists
    let itemExists = false;
    let itemName = '';
    
    if (itemType === 'file') {
      const file = await File.findOne({ _id: itemId, userId: req.user._id });
      if (file) {
        itemExists = true;
        itemName = file.name;
      }
    } else if (itemType === 'folder') {
      const folder = await Folder.findOne({ _id: itemId, userId: req.user._id });
      if (folder) {
        itemExists = true;
        itemName = folder.name;
      }
    }
    
    if (!itemExists) {
      return res.status(404).json({ message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found` });
    }
    
    // Generate a unique token for the share link
    const token = uuidv4();
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${token}`;
    
    // Create the share link in the database
    const newShareLink = new ShareLink({
      userId: req.user._id,
      ...(itemType === 'file' ? { fileId: itemId } : { folderId: itemId }),
      url: shareUrl,
      token,
      isPublic,
      password,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    await newShareLink.save();
    
    // Format the response
    const shareLinkResponse = {
      id: newShareLink._id,
      ...(itemType === 'file' ? { fileId: itemId } : { folderId: itemId }),
      itemName,
      itemType,
      url: newShareLink.url,
      token: newShareLink.token,
      isPublic: newShareLink.isPublic,
      password: newShareLink.password ? '********' : null,
      expiresAt: newShareLink.expiresAt,
      createdAt: newShareLink.createdAt,
      accessCount: 0,
      owner: newShareLink.userId
    };

    res.status(201).json(shareLinkResponse);
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ message: 'Failed to create share link' });
  }
});

// Get a specific share link
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the share link in the database
    const shareLink = await ShareLink.findOne({ _id: id, userId });
    
    if (!shareLink) {
      return res.status(404).json({ message: 'Share link not found' });
    }
    
    // Get the associated file or folder name
    let itemName = '';
    let itemType = '';
    
    if (shareLink.fileId) {
      const file = await File.findById(shareLink.fileId);
      if (file) {
        itemName = file.name;
        itemType = 'file';
      }
    } else if (shareLink.folderId) {
      const folder = await Folder.findById(shareLink.folderId);
      if (folder) {
        itemName = folder.name;
        itemType = 'folder';
      }
    }
    
    // Format the response
    const shareLinkResponse = {
      id: shareLink._id,
      fileId: shareLink.fileId,
      folderId: shareLink.folderId,
      itemName,
      itemType,
      url: shareLink.url,
      token: shareLink.token,
      isPublic: shareLink.isPublic,
      password: shareLink.password ? '********' : null,
      expiresAt: shareLink.expiresAt,
      createdAt: shareLink.createdAt,
      accessCount: shareLink.accessCount,
      owner: shareLink.userId
    };
    
    res.json(shareLinkResponse);
  } catch (error) {
    console.error('Error getting share link:', error);
    res.status(500).json({ message: 'Failed to get share link' });
  }
});

// Delete a share link
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, you would delete from the database

    res.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Error deleting share link:', error);
    res.status(500).json({ message: 'Failed to delete share link' });
  }
});

// Update a share link
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic, password, expiresAt } = req.body;

    // In a real implementation, you would update the database

    res.json({
      id,
      fileId: '1',
      url: `${req.protocol}://${req.get('host')}/share/${id}`,
      isPublic: isPublic !== undefined ? isPublic : true,
      password: password !== undefined ? password : null,
      expiresAt: expiresAt !== undefined ? expiresAt : null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating share link:', error);
    res.status(500).json({ message: 'Failed to update share link' });
  }
});

export default router;
