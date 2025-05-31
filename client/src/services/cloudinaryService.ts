import axios from 'axios';
import { Cloudinary } from 'cloudinary-core';
import { API_CONFIG } from '../config/api';

// Constants
const UPLOAD_TIMEOUT = 120000; // 2 minutes
const CHUNK_SIZE = 512 * 1024; // 512KB chunks for progress tracking

// Initialize Cloudinary with configuration
const cloudinary = new Cloudinary({
  cloud_name: API_CONFIG.CLOUDINARY.CLOUD_NAME,
  secure: true
});

// Create a service for Cloudinary operations
export const cloudinaryService = {
  // Upload an image to Cloudinary
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Try backend proxy first with increased timeout
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/api/images/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            withCredentials: true,
            timeout: UPLOAD_TIMEOUT,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted > 95 ? 95 : percentCompleted);
              }
            }
          }
        );
        
        if (onProgress) onProgress(100);
        return response.data.url;
      } catch (backendError) {
        console.warn('Backend upload failed, trying direct upload:', backendError);
      }
      
      // Try direct Cloudinary upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'cloudnest'); // Use a specific upload preset for security
        formData.append('cloud_name', API_CONFIG.CLOUDINARY.CLOUD_NAME);
        
        const uploadUrl = `https://api.cloudinary.com/v1_1/${API_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`;
        
        const directResponse = await axios.post(uploadUrl, formData, {
          timeout: UPLOAD_TIMEOUT,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted > 95 ? 95 : percentCompleted);
            }
          }
        });
        
        if (onProgress) onProgress(100);
        return directResponse.data.secure_url;
      } catch (cloudinaryError) {
        console.error('Direct Cloudinary upload failed:', cloudinaryError);
        throw cloudinaryError;
      }
    } catch (error: any) {
      console.error('All upload methods failed:', error);
      throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    }
  },

  // Get a secure URL for an image
  getImageUrl(publicId: string): string {
    if (publicId.startsWith('data:') || publicId.startsWith('http')) {
      return publicId;
    }
    
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
  }
};
