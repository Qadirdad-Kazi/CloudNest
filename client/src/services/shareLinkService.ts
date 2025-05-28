import axios from '../utils/axios';
import { ShareLink } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

// Create axios instance with base configuration
const API_URL = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SHARE_LINKS}`;

export const shareLinkService = {
  // Create a new share link
  async createShareLink(data: { fileId: string; expiresAt?: Date; password?: string }): Promise<ShareLink> {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  },
  
  // Get all share links
  async getShareLinks(): Promise<ShareLink[]> {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/share-links`);
      return response.data;
    } catch (error) {
      console.error('Error getting share links:', error);
      return [];
    }
  },
  
  // Get a specific share link
  async getShareLink(linkId: string): Promise<ShareLink> {
    try {
      const response = await axios.get(`${API_URL}/${linkId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting share link:', error);
      throw error;
    }
  },
  
  // Delete a share link
  async deleteShareLink(linkId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/${linkId}`);
    } catch (error) {
      console.error('Error deleting share link:', error);
      throw error;
    }
  },
  
  // Update a share link
  async updateShareLink(linkId: string, data: { expiresAt?: Date; password?: string }): Promise<ShareLink> {
    try {
      const response = await axios.patch(`${API_URL}/${linkId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating share link:', error);
      throw error;
    }
  }
};
