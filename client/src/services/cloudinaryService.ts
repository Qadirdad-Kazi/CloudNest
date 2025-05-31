import axios from 'axios'; // Use regular axios for Cloudinary
import { API_CONFIG } from '../config/api';

// Constants
const UPLOAD_TIMEOUT = 120000; // 2 minutes

export const cloudinaryService = {
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', API_CONFIG.CLOUDINARY.UPLOAD_PRESET);
      formData.append('cloud_name', API_CONFIG.CLOUDINARY.CLOUD_NAME);
      
      const uploadUrl = `https://api.cloudinary.com/v1_1/${API_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`;
      
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
      return response.data.secure_url;
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
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
      await axios.delete(`${API_CONFIG.BASE_URL}/api/files/cloudinary/delete/${publicId}`);
    } catch (error) {
      console.error('Error deleting Cloudinary image:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }
};
