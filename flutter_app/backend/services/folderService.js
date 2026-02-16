import Folder from '../models/Folder.js';

export const folderService = {
  // Create a new folder
  async createFolder(userId, name, parentPath = '/') {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Sanitize the name and path
      const sanitizedName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      // Normalize parent path - empty string or undefined should become '/'
      const normalizedPath = (parentPath || '/').replace(/\/+/g, '/').replace(/\/$/, '');
      
      console.log('Creating folder with:', {
        userId,
        name: sanitizedName,
        parentPath: normalizedPath
      });

      // Create the full path for the folder
      const folderPath = normalizedPath === '/' ? `/${sanitizedName}` : `${normalizedPath}/${sanitizedName}`;
      
      // Check if folder already exists at this path for this user
      const existingFolder = await Folder.findOne({
        userId,
        $or: [
          { path: folderPath },
          { path: folderPath + '/' }
        ],
        isDeleted: false
      });
      
      if (existingFolder) {
        throw new Error('A folder with this name already exists in this location');
      }

      // Create new folder in database
      const newFolder = new Folder({
        userId,
        name: sanitizedName,
        path: folderPath,
        parentPath: normalizedPath === '' ? '/' : normalizedPath, // Ensure empty string becomes '/'
        modifiedAt: new Date(),
        createdAt: new Date()
      });

      console.log('Saving new folder:', newFolder);
      
      await newFolder.save();
      
      console.log('Folder saved successfully:', newFolder);
      
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  // Get all folders for a user at a specific path
  async getFolders(userId, path = '/') {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Normalize the path - empty string or undefined should become '/'
      const normalizedPath = (path || '/').replace(/\/+/g, '/');
      
      // Create the query object
      const query = {
        userId,
        isDeleted: false,
        $or: [
          { parentPath: normalizedPath },
          { parentPath: '' } // Also match empty parent paths when looking at root
        ]
      };

      // If we're not at root, remove the empty parentPath condition
      if (normalizedPath !== '/') {
        query.$or = [{ parentPath: normalizedPath }];
      }

      console.log('Getting folders with query:', query);

      const folders = await Folder.find(query)
        .sort({ name: 1 })
        .lean() // Convert to plain JavaScript objects
        .exec();
      
      console.log(`Found ${folders.length} folders for user ${userId}`);
      console.log('Folders:', folders);
      
      return folders;
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  },

  // Delete a folder
  async deleteFolder(userId, folderId, permanent = false) {
    try {
      const folder = await Folder.findOne({ _id: folderId, userId });
      
      if (!folder) {
        throw new Error('Folder not found');
      }
      
      if (permanent) {
        // Permanently delete the folder
        await Folder.deleteOne({ _id: folderId, userId });
        console.log(`Folder permanently deleted: ${folderId}`);
        return { deleted: true, folderId };
      } else {
        // Soft delete the folder
        folder.isDeleted = true;
        folder.deletedAt = new Date();
        await folder.save();
        return folder;
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  // Rename a folder
  async renameFolder(userId, folderId, newName) {
    try {
      const folder = await Folder.findOne({ _id: folderId, userId });
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Update the folder name and path
      const sanitizedName = newName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const newPath = folder.parentPath === '/' ? `/${sanitizedName}` : `${folder.parentPath}/${sanitizedName}`;
      
      folder.name = sanitizedName;
      folder.path = newPath;
      folder.modifiedAt = new Date();
      
      await folder.save();
      return folder;
    } catch (error) {
      console.error('Error renaming folder:', error);
      throw error;
    }
  },

  // Star/unstar a folder
  async toggleStar(userId, folderId) {
    try {
      const folder = await Folder.findOne({ _id: folderId, userId });
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      folder.isStarred = !folder.isStarred;
      folder.modifiedAt = new Date();
      
      await folder.save();
      return folder;
    } catch (error) {
      console.error('Error toggling star status:', error);
      throw error;
    }
  }
}; 