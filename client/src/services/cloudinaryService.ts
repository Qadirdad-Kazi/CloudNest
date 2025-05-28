import axios from 'axios';
import { Cloudinary } from 'cloudinary-core';
import { API_CONFIG } from '../config/api';

// Initialize Cloudinary with configuration
const cloudinary = new Cloudinary({
  cloud_name: API_CONFIG.CLOUDINARY.CLOUD_NAME,
  secure: true
});

// Create a service for Cloudinary operations
export const cloudinaryService = {
  // Upload an image to Cloudinary or use local data URL as fallback
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
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
    
    // For development, just use data URLs for simplicity and reliability
    // This avoids Cloudinary API issues while developing
    if (API_CONFIG.IS_PRODUCTION === false) {
      try {
        // Create a data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Clean up progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
          if (onProgress) onProgress(100);
        }
        
        console.log('Using local data URL for development');
        return dataUrl;
      } catch (error) {
        console.error('Error creating data URL:', error);
        throw new Error('Failed to create data URL for image');
      }
    }
    
    // For production, try Cloudinary with fallbacks
    try {
      // Try backend proxy first
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/images/upload-public`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 5000 // 5 second timeout
          }
        );
        
        // Clean up progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
          if (onProgress) onProgress(100);
        }
        
        return response.data.url;
      } catch (backendError) {
        console.warn('Backend upload failed:', backendError);
        // Fall through to direct upload
      }
      
      // Try direct Cloudinary upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');
        
        const cloudName = API_CONFIG.CLOUDINARY.CLOUD_NAME;
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const directResponse = await axios.post(uploadUrl, formData, {
          timeout: 5000 // 5 second timeout
        });
        
        // Clean up progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
          if (onProgress) onProgress(100);
        }
        
        return directResponse.data.secure_url;
      } catch (cloudinaryError) {
        console.error('Direct Cloudinary upload failed:', cloudinaryError);
        // Fall through to data URL fallback
      }
      
      // Final fallback: data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Clean up progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        if (onProgress) onProgress(100);
      }
      
      console.log('Using local data URL as fallback');
      return dataUrl;
    } catch (error) {
      // Clean up progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        if (onProgress) onProgress(100);
      }
      
      console.error('All upload methods failed:', error);
      throw new Error('Failed to upload image');
    }
  },
  
  // Get a secure URL for an image
  getImageUrl(publicId: string): string {
    // If it's already a data URL or full URL, return it as is
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
