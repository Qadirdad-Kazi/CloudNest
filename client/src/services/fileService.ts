import axios from '../utils/axios';
import { FileItem, Folder } from '../types';
import { cloudinaryService } from './cloudinaryService';
import { mongodbService } from './mongodbService';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

// Constants for file upload
const UPLOAD_TIMEOUT = 120000; // 2 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File service for handling all file operations
 * Uses cloud storage (Cloudinary for images, MongoDB for documents)
 */
export const fileService = {
  /**
   * Validates a file for security before upload
   * @param file The file to validate
   * @returns Object with validation result and optional error message
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed (10MB). Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
      };
    }
    
    // Validate file extension
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const allowedTypes = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
      // Documents
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
      // Other common types
      'zip', 'rar', 'json', 'html', 'css', 'js', 'ts'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return { 
        valid: false, 
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
    
    // Sanitize filename
    if (file.name.includes('../') || file.name.includes('..\\') || 
        file.name.includes('/') || file.name.includes('\\') ||
        file.name.includes('..') || file.name.includes('~')) {
      return { valid: false, error: 'Invalid filename. Filename contains illegal characters.' };
    }
    
    return { valid: true };
  },
  
  /**
   * Creates a new folder
   * @param folderData Folder data including name, path, and owner
   * @returns Promise with the created folder
   */
  async createFolder(folderData: { name: string; path: string; owner: string }): Promise<Folder> {
    try {
      const response = await axios.post(API_ENDPOINTS.FOLDERS.CREATE, folderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${error?.message || 'Unknown error'}`);
    }
  },
  
  /**
   * Uploads a file to the server
   * @param file The file to upload
   * @param parentPath The parent directory path
   * @param onProgress Optional progress callback
   * @returns Promise<FileItem>
   */
  async uploadFile(file: File, parentPath: string = '/', onProgress?: (progress: number) => void): Promise<FileItem> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isImage = file.type.startsWith('image/');
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      // For images, try Cloudinary upload first
      if (isImage) {
        try {
          // Upload image to Cloudinary with progress tracking
          const imageUrl = await cloudinaryService.uploadImage(file, onProgress);
          
          // Save file metadata to database
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', parentPath);
          formData.append('type', fileType);
          formData.append('cloudinaryUrl', imageUrl);
          
          // Send to server with increased timeout
          const response = await axios.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: UPLOAD_TIMEOUT,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted > 95 ? 95 : percentCompleted);
              }
            }
          });
          
          if (onProgress) onProgress(100);
          return response.data;
        } catch (error: unknown) {
          console.error('Error uploading to Cloudinary:', error);
          throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // For non-image files, upload directly to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', parentPath);
      formData.append('type', fileType);

      const response = await axios.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: UPLOAD_TIMEOUT,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted > 95 ? 95 : percentCompleted);
          }
        }
      });

      if (onProgress) onProgress(100);
      return response.data;
    } catch (error: unknown) {
      console.error('Error in file upload process:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get files in a directory
   * @param path The directory path to get files from
   * @returns Promise with the list of files
   */
  async getFiles(path: string = '/'): Promise<FileItem[]> {
    try {
      // Call the backend API to get files
      const response = await axios.get(API_ENDPOINTS.FILES.LIST, {
        params: { path }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving files from server:', error);
      throw new Error(`Failed to get files: ${error?.message || 'Unknown error'}`);
    }
  },
  
  /**
   * Get recent files
   * @param days Number of days to look back
   * @returns Promise with the list of recent files
   */
  async getRecentFiles(days: number = 7): Promise<FileItem[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FILES.RECENT, {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving recent files:', error);
      throw new Error(`Failed to get recent files: ${error?.message || 'Unknown error'}`);
    }
  },
  
  /**
   * Get files in trash
   * @returns Promise with the list of trashed files
   */
  async getTrashedFiles(): Promise<FileItem[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FILES.TRASH);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving trashed files:', error);
      throw new Error(`Failed to get trashed files: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Move a file to trash
   * @param fileId ID of the file to move to trash
   * @returns Promise that resolves when the file is moved to trash
   */
  async moveToTrash(fileId: string): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.FILES.MOVE_TO_TRASH}/${fileId}`);
    } catch (error: any) {
      console.error('Error moving file to trash:', error);
      throw new Error(`Failed to move file to trash: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Restore a file from trash
   * @param fileId ID of the file to restore
   * @returns Promise that resolves when the file is restored
   */
  async restoreFromTrash(fileId: string): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.FILES.RESTORE}/${fileId}`);
    } catch (error: any) {
      console.error('Error restoring file from trash:', error);
      throw new Error(`Failed to restore file: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Empty the trash (permanently delete all files in trash)
   * @returns Promise that resolves when the trash is emptied
   */
  async emptyTrash(): Promise<void> {
    try {
      await axios.delete(API_ENDPOINTS.FILES.EMPTY_TRASH);
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      throw new Error(`Failed to empty trash: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Permanently delete a file (bypassing trash)
   * @param fileId ID of the file to delete
   * @returns Promise that resolves when the file is deleted
   */
  async permanentlyDeleteFile(fileId: string): Promise<void> {
    try {
      console.log('Permanently deleting file:', fileId);
      await axios.delete(`${API_ENDPOINTS.FILES.DELETE}/${fileId}?permanent=true`);
      console.log('File permanently deleted:', fileId);
    } catch (error: any) {
      console.error('Error permanently deleting file:', error);
      throw new Error(`Failed to permanently delete file: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Delete a file (always moves to trash first)
   * @param fileId ID of the file to delete
   * @returns Promise that resolves when the file is moved to trash
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log('Moving file to trash:', fileId);
      // Use the moveToTrash method to ensure consistency
      await this.moveToTrash(fileId);
    } catch (error: any) {
      console.error('Error moving file to trash:', error);
      throw new Error(`Failed to move file to trash: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Toggle star status of a file
   * @param fileId ID of the file to star/unstar
   * @returns Promise with the updated file
   */
  async toggleStar(fileId: string): Promise<FileItem> {
    try {
      // Use PATCH method with the file ID in the URL path, matching the server endpoint
      const response = await axios.patch(`${API_CONFIG.BASE_URL}/files/star/${fileId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error toggling star status:', error);
      throw new Error(`Failed to toggle star status: ${error?.message || 'Unknown error'}`);
    }
  },
  
  /**
   * Star or unstar a file (alias for toggleStar for backward compatibility)
   * @param fileId ID of the file to star/unstar
   * @returns Promise with the updated file
   */
  async starFile(fileId: string): Promise<FileItem> {
    return this.toggleStar(fileId);
  },
  
  /**
   * Rename a file
   * @param fileId ID of the file to rename
   * @param newName New name for the file
   * @returns Promise with the updated file
   */
  async renameFile(fileId: string, newName: string): Promise<FileItem> {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.FILES.UPDATE}/${fileId}`, { name: newName });
      return response.data;
    } catch (error: any) {
      console.error('Error renaming file:', error);
      throw new Error(`Failed to rename file: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Share a file with other users
   * @param fileId ID of the file to share
   * @param shareData Share data including emails and permissions
   * @returns Promise with the share link
   */
  async shareFile(fileId: string, shareData: { emails: string[]; permissions: string }): Promise<{ shareLink: string }> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.FILES.SHARE}/${fileId}`, shareData);
      return response.data;
    } catch (error: any) {
      console.error('Error sharing file:', error);
      throw new Error(`Failed to share file: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Search for files by query string
   * @param query The search query
   * @returns Promise with the list of files and folders matching the query
   */
  async searchFiles(query: string): Promise<(FileItem | Folder)[]> {
    try {
      // Call the backend API to search files
      const response = await axios.get(`${API_ENDPOINTS.FILES.LIST}/search`, {
        params: { query }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error searching files:', error);
      throw new Error(`Failed to search files: ${error?.message || 'Unknown error'}`);
    }
  },
  
};
