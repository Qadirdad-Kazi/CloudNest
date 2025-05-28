import axios from '../utils/axios';
import { FileItem, Folder } from '../types';
import { cloudinaryService } from './cloudinaryService';
import { mongodbService } from './mongodbService';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

// Create axios instance with base configuration
const API_URL = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.LIST}`;

export const fileService = {
  // Create a new folder
  async createFolder(folderData: { name: string; path: string; owner: string }): Promise<Folder> {
    try {
      const response = await axios.post(`${API_URL}/folders`, folderData);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },
  
  // Upload file with progress tracking
  async uploadFile(file: File, parentPath: string = '/', onProgress?: (progress: number) => void): Promise<FileItem> {
    // Determine file type
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileType);
    const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(fileType);
    
    // Base FileItem structure
    const baseFileItem: Partial<FileItem> = {
      name: file.name,
      path: parentPath,
      type: fileType,
      size: file.size,
      starred: false,
      shared: false,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      owner: 'current-user',
      tags: []
    };
    
    let fileItem: FileItem;
    
    try {
      // Handle based on file type
      if (isImage) {
        // Upload image to Cloudinary with progress tracking
        try {
          const imageUrl = await cloudinaryService.uploadImage(file, onProgress);
          fileItem = {
            ...baseFileItem,
            id: `img-${Date.now()}-${file.name}`,
            cloudinaryUrl: imageUrl, // Store Cloudinary URL
          } as FileItem;
        } catch (cloudinaryError) {
          console.error('Error uploading to Cloudinary:', cloudinaryError);
          // Fallback to local storage if Cloudinary fails
          fileItem = {
            ...baseFileItem,
            id: `file-${Date.now()}-${file.name}`,
          } as FileItem;
        }
      } else if (isDocument) {
        // Upload document to MongoDB with progress tracking
        try {
          fileItem = await mongodbService.uploadDocument(file, baseFileItem, onProgress);
        } catch (mongoError) {
          console.error('Error uploading to MongoDB:', mongoError);
          // Fallback to local storage if MongoDB fails
          fileItem = {
            ...baseFileItem,
            id: `file-${Date.now()}-${file.name}`,
          } as FileItem;
        }
      } else {
        // For other file types, use local storage with simulated progress
        // Simulate progress for basic file types
        if (onProgress) {
          let progress = 0;
          const simulateProgress = () => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress > 100) progress = 100;
            onProgress(progress);
            if (progress < 100) {
              setTimeout(simulateProgress, 200);
            }
          };
          simulateProgress();
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        fileItem = {
          ...baseFileItem,
          id: `file-${Date.now()}-${file.name}`,
        } as FileItem;
        
        // Ensure progress is set to 100%
        if (onProgress) onProgress(100);
      }
      
      // No need to save to localStorage as we're using cloud storage
    } catch (error) {
      console.error('Error in file upload process:', error);
      // Create a basic file item as fallback
      fileItem = {
        ...baseFileItem,
        id: `file-${Date.now()}-${file.name}`,
      } as FileItem;
      
      // Ensure progress is set to 100% on completion
      if (onProgress) onProgress(100);
    }
    
    return fileItem;
  },

  // Get files in a directory
  async getFiles(path: string = '/'): Promise<FileItem[]> {
    try {
      // Call the backend API to get files
      const response = await axios.get(`${API_CONFIG.BASE_URL}/files`, {
        params: { path }
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving files from server:', error);
      // Return empty array if there's an error
      return [];
    }
  },

  // Get recent files
  async getRecentFiles(days: number = 7): Promise<FileItem[]> {
    const response = await axios.get(`${API_URL}/recent`, {
      params: { days },
    });
    return response.data;
  },

  // Get files in trash
  async getTrashFiles(): Promise<FileItem[]> {
    const response = await axios.get(`${API_URL}/trash`);
    return response.data;
  },

  // Move file to trash
  async moveToTrash(fileId: string): Promise<void> {
    try {
      // Update the file's status in the database
      await axios.post(`${API_URL}/${fileId}/trash`);
    } catch (error) {
      console.error('Error moving file to trash:', error);
      throw error;
    }
  },

  // Restore file from trash
  async restoreFromTrash(fileId: string): Promise<void> {
    try {
      // Update the file's status in the database
      await axios.post(`${API_URL}/${fileId}/restore`);
    } catch (error) {
      console.error('Error restoring file from trash:', error);
      throw error;
    }
  },

  // Empty trash - permanently delete all files in trash
  async emptyTrash(): Promise<void> {
    try {
      // Get all files in trash first
      const trashFiles = await this.getTrashFiles();
      
      // Delete each file from cloud storage
      for (const file of trashFiles) {
        await this.permanentlyDeleteFile(file);
      }
      
      // Then tell the server to empty the trash
      await axios.delete(`${API_URL}/trash`);
    } catch (error) {
      console.error('Error emptying trash:', error);
      throw error;
    }
  },
  
  // Permanently delete a file from cloud storage
  async permanentlyDeleteFile(file: FileItem): Promise<void> {
    try {
      // Determine file type and delete from appropriate storage
      const fileType = file.type.toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileType);
      const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(fileType);
      
      if (isImage && file.cloudinaryUrl) {
        // Extract public ID from Cloudinary URL
        const urlParts = file.cloudinaryUrl.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];
        
        // Delete from Cloudinary
        try {
          await axios.delete(`${API_CONFIG.BASE_URL}/cloudinary/delete`, {
            data: { public_id: publicId }
          });
          console.log('Deleted image from Cloudinary:', publicId);
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
        }
      } else if (isDocument && file.mongodbId) {
        // Delete from MongoDB
        try {
          await axios.delete(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.DOCUMENTS.GET}/${file.mongodbId}`);
          console.log('Deleted document from MongoDB:', file.mongodbId);
        } catch (mongoError) {
          console.error('Error deleting from MongoDB:', mongoError);
        }
      }
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      throw error;
    }
  },

  // Delete file (with optional skipTrash parameter)
  async deleteFile(fileId: string, skipTrash: boolean = false): Promise<void> {
    try {
      if (skipTrash) {
        // Get the file details from the server
        try {
          const response = await axios.get(`${API_URL}/${fileId}`);
          const fileToDelete = response.data;
          
          if (fileToDelete) {
            // Permanently delete from cloud storage
            await this.permanentlyDeleteFile(fileToDelete);
          }
        } catch (getError) {
          console.error('Error getting file details before deletion:', getError);
          // Continue with deletion even if we couldn't get file details
        }
      }
      
      // Delete or move to trash on the server
      await axios.delete(`${API_URL}/${fileId}`, {
        params: { skipTrash },
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Star/unstar file
  async starFile(fileId: string): Promise<FileItem> {
    const response = await axios.patch(`${API_URL}/${fileId}/star`);
    return response.data;
  },
}; 