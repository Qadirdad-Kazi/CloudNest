import axios from 'axios';
import { FileItem } from '../types';

const API_URL = '/api/files';

export const fileService = {
  // Upload file
  async uploadFile(file: File, parentPath: string = '/'): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentPath', parentPath);

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get files in a directory
  async getFiles(path: string = '/'): Promise<FileItem[]> {
    const response = await axios.get(API_URL, {
      params: { path },
    });
    return response.data;
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
    await axios.post(`${API_URL}/${fileId}/trash`);
  },

  // Restore file from trash
  async restoreFromTrash(fileId: string): Promise<void> {
    await axios.post(`${API_URL}/${fileId}/restore`);
  },

  // Empty trash
  async emptyTrash(): Promise<void> {
    await axios.delete(`${API_URL}/trash`);
  },

  // Delete file (with optional skipTrash parameter)
  async deleteFile(fileId: string, skipTrash: boolean = false): Promise<void> {
    await axios.delete(`${API_URL}/${fileId}`, {
      params: { skipTrash },
    });
  },

  // Star/unstar file
  async starFile(fileId: string): Promise<FileItem> {
    const response = await axios.patch(`${API_URL}/${fileId}/star`);
    return response.data;
  },
}; 