import axios from '../utils/axios'; // Use custom axios instance with authentication
import { FileItem } from '../types';
import { API_ENDPOINTS } from '../config/api';

// Create a service for MongoDB operations
export const mongodbService = {
  // Upload a document to MongoDB
  async uploadDocument(file: File, metadata: Partial<FileItem>, onProgress?: (progress: number) => void): Promise<FileItem> {
    // Set up progress tracking
    let progressInterval: number | null = null;
    if (onProgress) {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 1;
        if (progress > 95) progress = 95; // Leave room for completion
        onProgress(progress);
      }, 200);
    }
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      
      // Append file as the first item (important for multipart parsing)
      formData.append('file', file, file.name);
      
      // Add metadata - ensure proper string conversion for all values
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert objects and arrays to JSON strings
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            // Convert primitive values to strings
            formData.append(key, String(value));
          }
        }
      });
      
      // Send the document to the server
      const response = await axios.post(
        API_ENDPOINTS.FILES.MONGODB.UPLOAD,
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted > 95 ? 95 : percentCompleted);
            }
          }
        }
      );
      
      // Clean up progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
        if (onProgress) onProgress(100);
      }
      
      return response.data;
    } catch (error: any) {
      // Clean up progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      console.error('Error uploading document:', error);
      throw new Error(`Failed to upload document: ${error?.message || 'Unknown error'}`);
    }
  },
  
  // Get a document from MongoDB
  async getDocument(documentId: string): Promise<Blob> {
    try {
      if (!documentId || documentId === 'undefined') {
        throw new Error('Document ID is required');
      }

      const response = await axios.get(`${API_ENDPOINTS.FILES.MONGODB.GET}/${documentId}`, {
        responseType: 'blob',
        withCredentials: true
      });
      return response.data;
    } catch (error: any) {
      console.error('Error getting document:', error);
      throw new Error(`Failed to retrieve document: ${error?.message || 'Unknown error'}`);
    }
  },
  
  // Get all documents from the database
  async getAllDocuments(): Promise<FileItem[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FILES.MONGODB.GET);
      return response.data;
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw new Error('Failed to retrieve documents');
    }
  },

  /**
   * Delete a document from MongoDB storage
   * @param documentId The ID of the document to delete
   * @returns Promise that resolves when the document is deleted
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      if (!documentId || documentId === 'undefined') {
        throw new Error('Document ID is required');
      }

      console.log('Deleting document from MongoDB:', documentId);
      const response = await axios.delete(`${API_ENDPOINTS.FILES.MONGODB.DELETE}/${documentId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete document from MongoDB');
      }

      console.log('Document deleted successfully from MongoDB:', documentId);
    } catch (error: any) {
      console.error('Error deleting MongoDB document:', error);
      throw new Error(`Failed to delete document from MongoDB: ${error?.message || 'Unknown error'}`);
    }
  }
};
