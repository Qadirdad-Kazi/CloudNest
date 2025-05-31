import axios from '../utils/axios';
import { Folder } from '../types';
import { API_ENDPOINTS } from '../config/api';

// Helper function to normalize folder data from server
const normalizeFolder = (folder: any): Folder => {
  return {
    id: folder.id || folder._id,
    name: folder.name,
    path: folder.path,
    owner: folder.owner || folder.userId,
    shared: folder.shared || false,
    starred: folder.isStarred || false, // Changed to use isStarred from server
    inTrash: folder.inTrash || false,
    tags: folder.tags || [],
    createdAt: folder.createdAt || new Date().toISOString(),
    modifiedAt: folder.modifiedAt || folder.updatedAt || new Date().toISOString()
  };
};

export const folderService = {
  // Create a new folder
  async createFolder(folderData: { name: string; path: string }): Promise<Folder> {
    try {
      console.log('Creating folder with data:', folderData);
      
      const response = await axios.post(API_ENDPOINTS.FOLDERS.CREATE, {
        name: folderData.name,
        path: folderData.path || '/'
      });
      
      console.log('Create folder response:', response.data);
      
      // Validate the response data
      if (!response.data || !response.data.id) {
        throw new Error('Invalid folder data received from server');
      }
      
      return normalizeFolder(response.data);
    } catch (error: any) {
      console.error('Error creating folder:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create folder');
      }
      throw new Error('Failed to create folder');
    }
  },
  
  // Get folders in a directory
  async getFolders(path: string = '/'): Promise<Folder[]> {
    try {
      console.log('Fetching folders for path:', path);
      
      const response = await axios.get(API_ENDPOINTS.FOLDERS.LIST, {
        params: { path }
      });
      
      console.log('Folders API response:', response.data);
      
      // Ensure we always return an array
      const folders = Array.isArray(response.data) ? response.data : [];
      
      // Normalize each folder object
      return folders.map(folder => normalizeFolder(folder));
    } catch (error: any) {
      console.error('Error getting folders:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        if (error.response.status === 401) {
          // Handle unauthorized error
          console.warn('User is not authenticated');
          return [];
        }
      }
      // Return empty array on error to prevent undefined errors
      return [];
    }
  },
  
  // Delete a folder
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await axios.delete(`${API_ENDPOINTS.FOLDERS.DELETE}/${folderId}`);
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete folder');
      }
      throw new Error('Failed to delete folder');
    }
  },
  
  // Move a folder to trash
  async moveToTrash(folderId: string): Promise<void> {
    try {
      if (!folderId) {
        throw new Error('Folder ID is required');
      }

      await axios.post(`${API_ENDPOINTS.FOLDERS.TRASH}/${folderId}`);
    } catch (error: any) {
      console.error('Error moving folder to trash:', error);
      throw new Error(`Failed to move folder to trash: ${error?.message || 'Unknown error'}`);
    }
  },
  
  // Rename a folder
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.FOLDERS.UPDATE}/${folderId}`, { name: newName });
      
      // Validate the response data
      if (!response.data || !response.data.folder) {
        throw new Error('Invalid response data from server');
      }
      
      return normalizeFolder(response.data.folder);
    } catch (error: any) {
      console.error('Error renaming folder:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to rename folder');
      }
      throw new Error('Failed to rename folder');
    }
  },
  
  // Toggle star status of a folder
  async toggleStar(folderId: string): Promise<Folder> {
    try {
      if (!folderId) {
        throw new Error('Folder ID is required');
      }
      const response = await axios.patch(`${API_ENDPOINTS.FOLDERS.STAR}/${folderId}`);
      return normalizeFolder(response.data);
    } catch (error: any) {
      console.error('Error toggling folder star:', error);
      throw new Error(`Failed to toggle folder star: ${error?.message || 'Unknown error'}`);
    }
  }
};
