import axios from 'axios'; // Use regular axios for Cloudinary uploads
import api from '../utils/axios'; // Use configured axios instance for our API
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

// Constants
const UPLOAD_TIMEOUT = 120000; // 2 minutes

export const cloudinaryService = {
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; cloudId: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', API_CONFIG.CLOUDINARY.UPLOAD_PRESET);
      formData.append('cloud_name', API_CONFIG.CLOUDINARY.CLOUD_NAME);
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${API_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`;
      
      console.log('Cloudinary Upload Configuration:', {
        cloudName: API_CONFIG.CLOUDINARY.CLOUD_NAME,
        uploadPreset: API_CONFIG.CLOUDINARY.UPLOAD_PRESET,
        uploadUrl: uploadUrl,
        fileName: file.name
      });
      
      const response = await axios.post(uploadUrl, formData, {
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
      
      console.log('✅ Cloudinary response:', {
        url: response.data.secure_url,
        public_id: response.data.public_id,
        format: response.data.format,
        bytes: response.data.bytes
      });
      
      return {
        url: response.data.secure_url,
        cloudId: response.data.public_id // This is what we need for deletion!
      };
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      if (error.response) {
        console.error('Cloudinary Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw new Error(`Failed to upload image: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`);
    }
  },

  getImageUrl(publicId: string): string {
    if (publicId.startsWith('data:') || publicId.startsWith('http')) {
      return publicId;
    }
    
    return `https://res.cloudinary.com/${API_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload/${publicId}`;
  },

  async deleteImage(publicId: string): Promise<void> {
    try {
      // Use our API client so baseURL and credentials are correct
      await api.delete(`${API_ENDPOINTS.FILES.CLOUDINARY.DELETE}/${publicId}`);
    } catch (error) {
      console.error('Error deleting Cloudinary image:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }
};
