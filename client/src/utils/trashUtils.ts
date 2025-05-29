import { FileItem } from '../types';
import { fileService } from '../services/fileService';

/**
 * Utility functions for trash operations
 * This provides a simpler interface for trash operations without relying on the FileContext
 */

/**
 * Move a file to trash
 * @param fileId ID of the file to move to trash
 * @param onSuccess Optional callback for successful operation
 * @param onError Optional callback for error
 */
export const moveFileToTrash = async (
  fileId: string, 
  onSuccess?: (fileId: string) => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    await fileService.moveToTrash(fileId);
    
    // Store in local trash as well for redundancy
    const trashedFile = { id: fileId, inTrash: true, deletedAt: new Date().toISOString() };
    const storedTrashedFiles = localStorage.getItem('trashedFiles');
    let trashedFiles = storedTrashedFiles ? JSON.parse(storedTrashedFiles) : [];
    trashedFiles = [...trashedFiles, trashedFile];
    localStorage.setItem('trashedFiles', JSON.stringify(trashedFiles));
    
    if (onSuccess) onSuccess(fileId);
  } catch (error) {
    console.error('Error moving file to trash:', error);
    if (onError) onError(error);
  }
};

/**
 * Restore a file from trash
 * @param fileId ID of the file to restore
 * @param onSuccess Optional callback for successful operation
 * @param onError Optional callback for error
 */
export const restoreFileFromTrash = async (
  fileId: string,
  onSuccess?: (restoredFile: FileItem) => void,
  onError?: (error: any) => void
): Promise<FileItem | null> => {
  try {
    const restoredFile = await fileService.restoreFromTrash(fileId);
    
    // Remove from local trash
    const storedTrashedFiles = localStorage.getItem('trashedFiles');
    if (storedTrashedFiles) {
      const trashedFiles = JSON.parse(storedTrashedFiles);
      const updatedTrashedFiles = trashedFiles.filter((file: any) => file.id !== fileId);
      localStorage.setItem('trashedFiles', JSON.stringify(updatedTrashedFiles));
    }
    
    if (onSuccess) onSuccess(restoredFile);
    return restoredFile;
  } catch (error) {
    console.error('Error restoring file from trash:', error);
    if (onError) onError(error);
    return null;
  }
};

/**
 * Empty the trash (permanently delete all files)
 * @param onSuccess Optional callback for successful operation
 * @param onError Optional callback for error
 */
export const emptyTrash = async (
  onSuccess?: (deletedFileIds: string[]) => void,
  onError?: (error: any) => void
): Promise<string[]> => {
  try {
    const deletedFileIds = await fileService.emptyTrash();
    
    // Clear local trash
    localStorage.removeItem('trashedFiles');
    
    if (onSuccess) onSuccess(deletedFileIds);
    return deletedFileIds;
  } catch (error) {
    console.error('Error emptying trash:', error);
    if (onError) onError(error);
    return [];
  }
};

/**
 * Get all files in trash
 * @param onSuccess Optional callback for successful operation
 * @param onError Optional callback for error
 */
export const getTrashFiles = async (
  onSuccess?: (files: FileItem[]) => void,
  onError?: (error: any) => void
): Promise<FileItem[]> => {
  try {
    // Get trash files from server
    let serverTrashFiles: FileItem[] = [];
    try {
      serverTrashFiles = await fileService.getTrashFiles();
      console.log('Server trash files:', serverTrashFiles);
    } catch (serverError) {
      console.warn('Could not fetch trash files from server:', serverError);
    }
    
    // Get local trash files
    const storedTrashedFiles = localStorage.getItem('trashedFiles');
    const localTrashFiles: any[] = storedTrashedFiles ? JSON.parse(storedTrashedFiles) : [];
    
    // Merge and deduplicate
    const allTrashFiles = [...serverTrashFiles];
    localTrashFiles.forEach(localFile => {
      if (!allTrashFiles.some(file => file.id === localFile.id)) {
        allTrashFiles.push(localFile);
      }
    });
    
    if (onSuccess) onSuccess(allTrashFiles);
    return allTrashFiles;
  } catch (error) {
    console.error('Error getting trash files:', error);
    if (onError) onError(error);
    
    // Try to return local trash as fallback
    try {
      const storedTrashedFiles = localStorage.getItem('trashedFiles');
      const localTrashFiles = storedTrashedFiles ? JSON.parse(storedTrashedFiles) : [];
      return localTrashFiles;
    } catch (localError) {
      return [];
    }
  }
};
