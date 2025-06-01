import axios from '../utils/axios';
import { FileItem, Folder } from '../types';
import { cloudinaryService } from './cloudinaryService';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

// Constants for file upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper function to normalize file data from server - optimized for performance
export const normalizeFile = (file: any): FileItem => {
  // Direct return without unnecessary logging for better performance
  return {
    id: file._id || file.id,
    name: file.name,
    type: file.type,
    size: file.size,
    path: file.path,
    starred: file.isStarred !== undefined ? Boolean(file.isStarred) : Boolean(file.starred),
    shared: file.isShared !== undefined ? Boolean(file.isShared) : Boolean(file.shared),
    inTrash: Boolean(file.isDeleted),
    cloudProvider: file.cloudProvider || 'unknown',
    url: file.url || '',
    createdAt: file.createdAt || new Date().toISOString(),
    updatedAt: file.modifiedAt || file.updatedAt || new Date().toISOString(),
    mongodbId: file.mongodbId
  };
};

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
  uploadFile: async (file: File, parentPath: string = '/', onProgress?: (progress: number) => void): Promise<FileItem> => {
    // Determine if this is an image file that should go to Cloudinary
    const isImage = file.type.startsWith('image/');
    
    try {
      let fileUrl = '';
      let responseData;
      
      if (isImage) {
        // Upload image to Cloudinary
        console.log('Uploading image to Cloudinary:', file.name);
        fileUrl = await cloudinaryService.uploadImage(file, onProgress);
        
        // Ensure URL has https:// prefix
        if (fileUrl && !fileUrl.startsWith('http')) {
          fileUrl = 'https://' + fileUrl;
        }
        
        console.log('Cloudinary upload successful, URL:', fileUrl);
        
        // Extract cloudinary ID for debugging
        const matches = fileUrl.match(/\/v\d+\/([^\/\.]+)/);
        const cloudId = matches && matches[1] ? matches[1] : null;
        console.log('Extracted Cloudinary ID:', cloudId);
      } else {
        // For non-image files, use MongoDB GridFS via our API
        console.log('Uploading file to MongoDB GridFS:', file.name);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', parentPath);
        
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.UPLOAD}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
              }
            },
            timeout: 30000 // 30 seconds timeout
          }
        );
        
        responseData = response.data;
        fileUrl = responseData.url;
      }
      
      // Create file record in database
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        path: parentPath,
        url: fileUrl,
        cloudProvider: isImage ? 'cloudinary' : 'mongodb'
      };
      
      console.log('Creating file record with data:', fileData);
      
      try {
        // Add retry logic for creating file record
        const maxRetries = 2;
        let retryCount = 0;
        let response;
        
        while (retryCount <= maxRetries) {
          try {
            response = await axios.post(
              `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.LIST}`, 
              fileData,
              { timeout: 10000 } // 10 second timeout
            );
            break; // Success, exit the retry loop
          } catch (err) {
            retryCount++;
            if (retryCount > maxRetries) throw err;
            console.log(`Retry ${retryCount}/${maxRetries} for creating file record...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
        
        if (!response || !response.data) {
          throw new Error('No response data received from server');
        }
        
        // Ensure the URL is properly set in the returned data
        if (response.data && isImage && fileUrl) {
          response.data.url = fileUrl;
        }
        
        return normalizeFile(response.data);
      } catch (err: any) {
        console.error('Error creating file record:', err);
        
        // If we failed to create the record but uploaded to Cloudinary,
        // return a manually constructed file object
        if (isImage && fileUrl) {
          console.log('Creating manual file record for Cloudinary image');
          // Create a manual file object that matches what normalizeFile returns
          const manualFile: FileItem = {
            id: `temp-${Date.now()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            path: parentPath,
            starred: false,
            shared: false,
            inTrash: false,
            cloudProvider: 'cloudinary',
            url: fileUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mongodbId: undefined
          };
          return manualFile;
        }
        throw err;
      }
    } catch (error: any) {
      console.error('Error in file upload process:', error);
      throw new Error(`Error uploading file: ${error.message}`);
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
      
      // Normalize each file in the response
      const normalizedFiles = response.data.map((file: any) => normalizeFile(file));
      console.log('Normalized files:', normalizedFiles);
      return normalizedFiles;
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
   * Get trashed files
   * @returns Promise with array of trashed files
   */
  async getTrashedFiles(): Promise<FileItem[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FILES.TRASH);
      return response.data.map(normalizeFile);
    } catch (error) {
      console.error('Error getting trashed files:', error);
      throw new Error('Failed to get trashed files');
    }
  },
  
  // Enhanced cache for starred files to improve performance and persistence
  _starredFilesCache: null as FileItem[] | null,
  _starredFilesCacheTime: 0,
  _starredFilesCacheTTL: 60000, // 60 seconds cache TTL (increased for better persistence)
  
  /**
   * Get starred files - enhanced with persistent caching
   * @returns Promise with array of starred files
   */
  async getStarredFiles(): Promise<FileItem[]> {
    try {
      // Check if we have a valid cache
      const now = Date.now();
      if (
        this._starredFilesCache && 
        Array.isArray(this._starredFilesCache) &&
        this._starredFilesCache.length > 0 &&
        this._starredFilesCacheTime > 0 && 
        now - this._starredFilesCacheTime < this._starredFilesCacheTTL
      ) {
        // Return cached data if it's still valid
        // Make sure all files have starred=true for consistency
        return this._starredFilesCache.map(file => ({
          ...file,
          starred: true
        }));
      }
      
      // Cache miss or expired, fetch from server
      const response = await axios.get(API_ENDPOINTS.FILES.STARRED);
      
      // If server returns empty but we have cached data and it's not too old (within 5 minutes),
      // use the cached data as fallback to prevent files from disappearing
      if ((!response.data || response.data.length === 0) && 
          this._starredFilesCache && 
          Array.isArray(this._starredFilesCache) &&
          this._starredFilesCache.length > 0 &&
          now - this._starredFilesCacheTime < 300000) { // 5 minutes fallback
        return this._starredFilesCache;
      }
      
      // Process server response
      const files = response.data.map((file: any) => {
        const normalized = normalizeFile(file);
        normalized.starred = true; // Always ensure starred is true
        return normalized;
      });
      
      // Only update cache if we got actual files
      if (files && files.length > 0) {
        this._starredFilesCache = files;
        this._starredFilesCacheTime = now;
      }
      
      return files;
    } catch (error: any) {
      console.error('Error getting starred files:', error);
      
      // If there's an error but we have cached data, return it as fallback
      if (this._starredFilesCache && Array.isArray(this._starredFilesCache) && this._starredFilesCache.length > 0) {
        return this._starredFilesCache;
      }
      
      throw new Error(`Failed to get starred files: ${error?.message || 'Unknown error'}`);
    }
  },
  
  /**
   * Clear the starred files cache
   * Call this after any operation that might change starred status
   */
  clearStarredFilesCache(): void {
    this._starredFilesCache = null;
    this._starredFilesCacheTime = 0;
  },
  
  /**
   * Move a file to trash
   * @param fileId ID of the file to move to trash
   * @returns Promise that resolves when the file is moved to trash
   */
  async moveToTrash(fileId: string): Promise<void> {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      const id = fileId.toString(); // Convert to string in case it's an ObjectId
      console.log('Moving file to trash:', id);
      
      // Just update the file status in the database to mark it as trashed
      await axios.post(`${API_ENDPOINTS.FILES.MOVE_TO_TRASH}/${id}`);
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
      if (!fileId || fileId === 'undefined') {
        throw new Error('File ID is required');
      }

      console.log('Restoring file from trash:', fileId);
      const id = fileId.toString(); // Convert to string in case it's an ObjectId
      await axios.post(`${API_ENDPOINTS.FILES.RESTORE}/${id}`);
      console.log('File restored successfully:', id);
    } catch (error: any) {
      console.error('Error restoring file:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to restore file: ${errorMessage}`);
    }
  },

  /**
   * Permanently delete a file from all storage systems
   * @param fileId ID of the file to delete
   * @returns Promise that resolves when the file is deleted
   */
  async permanentlyDeleteFile(fileId: string): Promise<void> {
    try {
      if (!fileId || fileId === 'undefined') {
        throw new Error('File ID is required');
      }

      const id = fileId.toString(); // Convert to string in case it's an ObjectId
      console.log('Permanently deleting file:', id);
      
      // Delete the file record from our database with permanent flag
      // This will trigger the server to clean up associated storage
      console.log('Deleting file record from database:', id);
      const deleteResponse = await axios.delete(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.LIST}/${id}`, {
        params: { permanent: true }
      });

      // Check if we got a success response
      if (deleteResponse.data?.message === 'File permanently deleted' || deleteResponse.data?.success) {
        console.log('Successfully deleted file:', id);
        return;
      }

      throw new Error(deleteResponse.data?.message || 'Failed to delete file record');
    } catch (error: any) {
      console.error('Error in permanentlyDeleteFile:', error);
      // Check if it's a 404 error and handle it gracefully
      if (error.response?.status === 404) {
        console.log('File not found, might have been already deleted');
        return; // Return silently as the file is already gone
      }
      // Check if the error message indicates success
      if (error.message === 'File permanently deleted') {
        console.log('Successfully deleted file:', fileId);
        return;
      }
      throw new Error(`Failed to permanently delete file: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Empty the trash by permanently deleting all trashed files
   * @returns Promise that resolves when all trashed files are deleted
   */
  async emptyTrash(): Promise<void> {
    try {
      // Get all files in trash
      const trashedFiles = await this.getTrashedFiles();
      
      if (!trashedFiles || trashedFiles.length === 0) {
        return;
      }
      
      // Delete each file permanently
      const errors: Error[] = [];
      let successCount = 0;
      
      for (const file of trashedFiles) {
        if (!file.id || file.id === 'undefined') continue;
        
        try {
          await this.permanentlyDeleteFile(file.id);
          successCount++;
        } catch (error) {
          if (error instanceof Error && error.message.includes('File permanently deleted')) {
            // This is actually a success
            successCount++;
          } else {
            console.error(`Error deleting file ${file.id}:`, error);
            errors.push(error as Error);
          }
          // Continue with next file
        }
      }
      
      // Notify the server that trash has been emptied
      try {
        await axios.delete(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.EMPTY_TRASH}`);
      } catch (error) {
        console.error('Error notifying server about empty trash:', error);
        // Don't throw here as files are already deleted
      }

      // Log the final results
      console.log(`Trash emptying completed. Successfully deleted ${successCount} files.`);
      
      // If there were any actual errors, report them
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} files. ${successCount} files were successfully deleted.`);
      }
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      throw new Error(`Failed to empty trash: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Delete a file (always moves to trash first)
   * @param fileId ID of the file to delete
   * @returns Promise that resolves when the file is moved to trash
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      const id = fileId.toString(); // Convert to string in case it's an ObjectId
      console.log('Moving file to trash:', id);
      // Use the moveToTrash method to ensure consistency
      await this.moveToTrash(id);
    } catch (error: any) {
      console.error('Error moving file to trash:', error);
      throw new Error(`Failed to move file to trash: ${error?.message || 'Unknown error'}`);
    }
  },

  /**
   * Toggle star status for a file
   * @param fileId ID of the file to toggle star status
   * @returns Promise with updated file data
   */
  async toggleStar(fileId: string): Promise<FileItem> {
    try {
      if (!fileId || fileId === 'undefined') {
        throw new Error('File ID is required');
      }

      // Make the API call to toggle star status
      const response = await axios.patch(`${API_ENDPOINTS.FILES.STAR}/${fileId}`);
      const normalizedFile = normalizeFile(response.data);
      
      // Clear the starred files cache since we've changed a star status
      this.clearStarredFilesCache();
      
      return normalizedFile;
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
