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
      formData.append('file', file);
      
      // Add metadata
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      
      // Send the document to the server
      const response = await axios.post(
        API_ENDPOINTS.DOCUMENTS.UPLOAD, // The base URL is already included in the axios instance
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true, // Ensure cookies are sent with the request
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted > 95 ? 95 : percentCompleted); // Cap at 95% until complete
            }
          }
        }
      );
      
      // Clean up progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        if (onProgress) onProgress(100);
      }
      
      // Return the document data from MongoDB
      return response.data;
    } catch (error) {
      console.error('Error uploading document to MongoDB:', error);
      
      // Clean up progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        if (onProgress) onProgress(100);
      }
      
      // Log the error details for debugging
      console.log('Document upload failed with metadata:', metadata);
      
      throw new Error('Failed to upload document to MongoDB');
    }
  },
  
  // Get a document from MongoDB
  async getDocument(documentId: string): Promise<Blob> {
    try {
      // Get the document from the server
      const response = await axios.get(
        `${API_ENDPOINTS.DOCUMENTS.GET}/${documentId}`, 
        {
          responseType: 'blob',
          withCredentials: true // Ensure cookies are sent with the request
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting document from MongoDB:', error);
      throw new Error('Failed to retrieve document');
    }
  }
};
