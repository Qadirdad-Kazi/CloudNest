import axios from '../utils/axios';
import { Folder } from '../types';
import { API_ENDPOINTS } from '../config/api';

// Use the API endpoint directly as it now includes the base URL
const API_URL = API_ENDPOINTS.FOLDERS.LIST;

export const folderService = {
  // Create a new folder
  async createFolder(folderData: { name: string; path: string }): Promise<Folder> {
    try {
      const response = await axios.post(API_URL, folderData);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },
  
  // Get folders in a directory
  async getFolders(path: string = '/'): Promise<Folder[]> {
    try {
      const response = await axios.get(API_URL, {
        params: { path }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  },
  
  // Delete a folder
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/${folderId}`);
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },
  
  // Rename a folder
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    try {
      const response = await axios.patch(`${API_URL}/${folderId}/rename`, { name: newName });
      return response.data;
    } catch (error) {
      console.error('Error renaming folder:', error);
      throw error;
    }
  }
};
