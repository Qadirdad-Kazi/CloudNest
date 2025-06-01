import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { FileItem, Folder, ShareLink, BreadcrumbItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './NotificationContext';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { shareLinkService } from '../services/shareLinkService';
import { normalizeFile } from '../services/fileService';

// Define the shape of our context
interface FileContextType {
  files: FileItem[];
  folders: Folder[];
  shareLinks: ShareLink[];
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  selectedItems: (FileItem | Folder)[];
  isLoading: boolean;
  uploadProgress: number;
  error: string | null;
  storageUsed: number;
  storageLimit: number;
  setCurrentPath: (path: string) => void;
  createFolder: (name: string) => Promise<void>;
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  deleteItems: (items: (FileItem | Folder)[]) => Promise<void>;
  renameItem: (item: FileItem | Folder, newName: string) => Promise<void>;
  toggleSelect: (item: FileItem | Folder) => void;
  clearSelection: () => void;
  selectAll: () => void;
  starItem: (item: FileItem | Folder) => Promise<void>;
  shareItem: (item: FileItem | Folder, isPublic: boolean, password?: string, expiry?: Date) => Promise<ShareLink>;
  searchItems: (query: string) => Promise<(FileItem | Folder)[]>;
  deleteFile: (fileId: string, permanent: boolean) => Promise<void>;
  starFile: (fileId: string) => Promise<void>;
  moveToTrash: (fileId: string) => Promise<void>;
  restoreFromTrash: (fileId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  getTrashFiles: () => Promise<FileItem[]>;
  refreshFiles: () => Promise<void>;
}

// Create the context with default values
const FileContext = createContext<FileContextType>({
  files: [],
  folders: [],
  shareLinks: [],
  currentPath: '/',
  breadcrumbs: [{ name: 'Home', path: '/' }],
  selectedItems: [],
  isLoading: false,
  uploadProgress: 0,
  error: null,
  storageUsed: 0,
  storageLimit: 1024 * 1024 * 1024, // 1GB
  setCurrentPath: () => {},
  createFolder: async () => {},
  uploadFile: async () => {},
  deleteItems: async () => {},
  renameItem: async () => {},
  toggleSelect: () => {},
  clearSelection: () => {},
  selectAll: () => {},
  starItem: async () => {},
  shareItem: async () => ({ id: '', fileId: '', url: '', isPublic: false, createdAt: '' }),
  searchItems: async () => [],
  deleteFile: async () => {},
  starFile: async () => {},
  moveToTrash: async () => {},
  restoreFromTrash: async () => {},
  emptyTrash: async () => {},
  getTrashFiles: async () => [],
  refreshFiles: async () => {},
});

// Custom hook to use the file context
export const useFiles = () => useContext(FileContext);

// Provider component
export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: currentUser, getStorageInfo } = useAuth();
  const { addNotification } = useNotifications();
  
  // State variables
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItems, setSelectedItems] = useState<(FileItem | Folder)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const storageLimit = 1024 * 1024 * 1024; // 1GB

  // Calculate breadcrumbs based on current path
  const getBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const parts = path.split('/').filter(part => part !== '');
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', path: '/' }];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath += `/${part}`;
      breadcrumbs.push({ name: part, path: currentPath });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(currentPath);

  // Function to update storage info
  const updateStorageInfo = async () => {
    try {
      const info = await getStorageInfo();
      setStorageUsed(info.storageUsed);
    } catch (error) {
      console.error('Error updating storage info:', error);
    }
  };

  // Function to refresh files and folders
  const refreshFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [newFiles, newFolders] = await Promise.all([
        fileService.getFiles(currentPath),
        folderService.getFolders(currentPath)
      ]);
      
      setFiles(newFiles);
      setFolders(newFolders);
    } catch (error) {
      console.error('Error refreshing files:', error);
      setError('Failed to refresh files');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate storage used
  useEffect(() => {
    updateStorageInfo();
  }, [files]);

  // Load files and folders when path changes
  useEffect(() => {
    // Only load files if user is authenticated
    if (currentUser) {
      loadFiles();
    } else {
      // Clear files and folders when not authenticated
      setFiles([]);
      setFolders([]);
    }
  }, [currentPath, currentUser]);

  // Create a new folder
  const createFolder = async (name: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Creating folder:', { name, path: currentPath });
      
      const newFolder = await folderService.createFolder({ name, path: currentPath });
      
      console.log('New folder created:', newFolder);
      
      // Update folders state with the new folder
      setFolders(prev => {
        // Make sure we don't add duplicates
        const exists = prev.some(folder => folder.id === newFolder.id);
        if (exists) {
          return prev;
        }
        return [...prev, newFolder];
      });
      
      // Reload the current directory to ensure consistency
      await loadFiles(currentPath);
      
      addNotification({
        type: 'success',
        message: `Folder "${name}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder');
      addNotification({
        type: 'error',
        message: 'Failed to create folder',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload file with storage update
  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    try {
      await fileService.uploadFile(file, currentPath, onProgress);
      await refreshFiles();
      await updateStorageInfo();
      addNotification({
        type: 'success',
        message: `Successfully uploaded ${file.name}`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      addNotification({
        type: 'error',
        message: `Failed to upload ${file.name}`
      });
      throw error;
    }
  };

  // Delete items with storage update
  const deleteItems = async (items: (FileItem | Folder)[]) => {
    try {
      for (const item of items) {
        if ('type' in item) {
          await fileService.deleteFile(item.id);
        } else {
          await folderService.deleteFolder(item.id);
        }
      }
      await refreshFiles();
      await updateStorageInfo();
      addNotification({
        type: 'success',
        message: `Successfully deleted ${items.length} item(s)`
      });
    } catch (error) {
      console.error('Error deleting items:', error);
      addNotification({
        type: 'error',
        message: 'Failed to delete items'
      });
      throw error;
    }
  };

  // Rename a file or folder
  const renameItem = async (item: FileItem | Folder, newName: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if ('type' in item) {
        // It's a file
        const updatedFile = await fileService.renameFile(item.id, newName);
        setFiles(prev => prev.map(file => 
          file.id === item.id ? updatedFile : file
        ));
      } else {
        // It's a folder
        const updatedFolder = await folderService.renameFolder(item.id, newName);
        setFolders(prev => prev.map(folder => 
          folder.id === item.id ? updatedFolder : folder
        ));
      }
      
      addNotification({
        type: 'success',
        message: `Item renamed to "${newName}" successfully`,
      });
    } catch (error) {
      console.error('Error renaming item:', error);
      setError('Failed to rename item');
      addNotification({
        type: 'error',
        message: 'Failed to rename item',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection of an item
  const toggleSelect = (item: FileItem | Folder): void => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i.id === item.id);
      
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  // Clear all selections
  const clearSelection = (): void => {
    setSelectedItems([]);
  };

  // Select all items in the current view
  const selectAll = (): void => {
    const allItems = [...files, ...folders];
    setSelectedItems(allItems);
  };

  // Star/unstar an item
  const starItem = async (item: FileItem | Folder): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const itemId = item.id || (item as any)._id;
      if (!itemId) {
        throw new Error('Invalid item: missing ID');
      }
      
      if ('type' in item) {
        // It's a file
        const updatedFile = await fileService.toggleStar(itemId);
        setFiles(prev => prev.map(file => 
          (file.id === itemId || (file as any)._id === itemId) ? normalizeFile(updatedFile) : file
        ));
      } else {
        // It's a folder
        const updatedFolder = await folderService.toggleStar(itemId);
        setFolders(prev => prev.map(folder => 
          (folder.id === itemId || (folder as any)._id === itemId) ? updatedFolder : folder
        ));
      }
      
      const action = item.starred ? 'removed from' : 'added to';
      addNotification({
        type: 'success',
        message: `Item ${action} favorites`,
      });
    } catch (error) {
      console.error('Error starring item:', error);
      setError('Failed to update favorites');
      addNotification({
        type: 'error',
        message: 'Failed to update favorites',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Share an item
  const shareItem = async (
    item: FileItem | Folder, 
    isPublic: boolean, 
    password?: string, 
    expiry?: Date
  ): Promise<ShareLink> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const shareLink = await shareLinkService.createShareLink({
        itemId: item.id,
        itemType: 'file' in item ? 'file' : 'folder', // Determine if it's a file or folder
        isPublic,
        password,
        expiresAt: expiry, // Pass the Date object directly
      });
      
      setShareLinks(prev => [...prev, shareLink]);
      
      addNotification({
        type: 'success',
        message: 'Share link created successfully',
      });
      
      return shareLink;
    } catch (error) {
      console.error('Error sharing item:', error);
      setError('Failed to create share link');
      addNotification({
        type: 'error',
        message: 'Failed to create share link',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Search for items
  const searchItems = async (query: string): Promise<(FileItem | Folder)[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await fileService.searchFiles(query);
      
      return results;
    } catch (error) {
      console.error('Error searching items:', error);
      setError('Failed to search items');
      addNotification({
        type: 'error',
        title: 'Error Searching',
        message: 'Failed to search items. Please try again.',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load files and folders for the current path with throttling to prevent infinite loops
  const loadFiles = async (path: string = currentPath) => {
    // Don't make API calls if not authenticated
    if (!currentUser) {
      setFiles([]);
      setFolders([]);
      return;
    }
    
    // Implement throttling to prevent rapid repeated calls
    const now = Date.now();
    const lastLoadTime = localStorage.getItem('lastFileLoadTime');
    const loadThrottleMs = 2000; // 2 seconds minimum between loads
    
    if (lastLoadTime && (now - parseInt(lastLoadTime)) < loadThrottleMs) {
      console.log('Throttling file load - too many requests in short time');
      return; // Skip this load request
    }
    
    // Update the last load timestamp
    localStorage.setItem('lastFileLoadTime', now.toString());

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading files and folders for path:', path);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });
      
      // Wrap API calls in Promise.race with timeout
      const [filesResponse, foldersResponse] = await Promise.all([
        Promise.race([fileService.getFiles(path), timeoutPromise]),
        Promise.race([folderService.getFolders(path), timeoutPromise])
      ]).catch(error => {
        console.error('Error or timeout in API calls:', error);
        // Return empty arrays on error
        return [[], []];
      });
      
      console.log('Files response:', filesResponse);
      console.log('Folders response:', foldersResponse);
      
      // Ensure we have arrays before setting state
      const validFiles = Array.isArray(filesResponse) ? filesResponse : [];
      const validFolders = Array.isArray(foldersResponse) ? foldersResponse : [];
      
      // Update state with the fetched data
      setFiles(validFiles);
      setFolders(validFolders);
      
      console.log('Updated state - Files:', validFiles.length, 'Folders:', validFolders.length);
    } catch (error) {
      console.error('Error loading files and folders:', error);
      // Don't set error state for network errors to prevent UI issues
      if (error instanceof Error && error.message.includes('Network Error')) {
        console.warn('Network error detected, likely CORS issue');
      } else {
        setError('Failed to load files and folders');
        // Show notification only for non-network errors
        addNotification({
          type: 'error',
          title: 'Error Loading Files',
          message: 'Could not load your files. Please try again later.'
        });
      }
      // Set empty arrays on error to prevent stale data
      setFiles([]);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrashedFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fileService.getTrashedFiles();
      setFiles(response);
      setCurrentPath('/trash');
    } catch (error) {
      console.error('Error loading trashed files:', error);
      setError('Failed to load trashed files');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a single file
  const deleteFile = async (fileId: string, permanent: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!fileId) {
        throw new Error('File ID is required');
      }

      if (permanent) {
        await fileService.permanentlyDeleteFile(fileId);
      } else {
        await fileService.moveToTrash(fileId);
      }

      // Update the files list
      setFiles(prev => prev.filter(file => file.id !== fileId));

      addNotification({
        type: 'success',
        message: permanent ? 'File permanently deleted' : 'File moved to trash'
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setError(error.message || 'Failed to delete file');
      addNotification({
        type: 'error',
        message: `Failed to delete file: ${error.message || 'Unknown error'}`
      });
      throw error; // Re-throw to handle in component
    } finally {
      setIsLoading(false);
    }
  };

  // Star/unstar a file
  const starFile = async (fileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Toggling star for file:', fileId);
      const serverResponse = await fileService.toggleStar(fileId);
      console.log('Server response:', serverResponse);
      
      // Update local state with normalized file data
      const normalizedFile = normalizeFile(serverResponse);
      setFiles(prev => prev.map(file => 
        file.id === fileId ? normalizedFile : file
      ));
      
      // Refresh the current directory to ensure consistency
      await loadFiles(currentPath);
      
      const action = normalizedFile.starred ? 'added to' : 'removed from';
      addNotification({
        type: 'success',
        message: `File ${action} favorites`,
      });
    } catch (error) {
      console.error('Error starring file:', error);
      setError('Failed to update favorites');
      addNotification({
        type: 'error',
        message: 'Failed to update favorites',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Move a file to trash
  const moveToTrash = async (fileId: string) => {
    try {
      await fileService.moveToTrash(fileId);
      // Refresh the current view
      if (currentPath === '/trash') {
        await loadTrashedFiles();
      } else {
        await loadFiles(currentPath);
      }
    } catch (error) {
      console.error('Error moving file to trash:', error);
      throw new Error('Failed to move file to trash');
    }
  };

  // Restore a file from trash
  const restoreFromTrash = async (fileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!fileId || fileId === 'undefined' || typeof fileId !== 'string') {
        const error = new Error('File ID is required and must be a valid string');
        console.error('Invalid file ID:', { fileId, type: typeof fileId });
        throw error;
      }

      await fileService.restoreFromTrash(fileId);

      // Update the files list
      setFiles(prev => prev.map(file => {
        const mongoFile = file as FileItem & { _id?: string };
        if (file.id === fileId || (mongoFile._id && mongoFile._id === fileId)) {
          return { ...file, inTrash: false };
        }
        return file;
      }));

      addNotification({
        type: 'success',
        message: 'File restored successfully'
      });
    } catch (error: any) {
      console.error('Error restoring file:', error);
      setError(error.message || 'Failed to restore file');
      addNotification({
        type: 'error',
        message: `Failed to restore file: ${error.message || 'Unknown error'}`
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Empty trash with storage update
  const emptyTrash = async () => {
    try {
      await fileService.emptyTrash();
      await refreshFiles();
      await updateStorageInfo();
      addNotification({
        type: 'success',
        message: 'Trash emptied successfully'
      });
    } catch (error) {
      console.error('Error emptying trash:', error);
      addNotification({
        type: 'error',
        message: 'Failed to empty trash'
      });
      throw error;
    }
  };

  // Get files in trash
  const getTrashFiles = async (): Promise<FileItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const trashedFiles = await fileService.getTrashedFiles();
      return trashedFiles || [];
    } catch (error: any) {
      console.error('Error getting trashed files:', error);
      setError(error.message || 'Failed to get trashed files');
      addNotification({
        type: 'error',
        message: `Failed to get trashed files: ${error.message || 'Unknown error'}`
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Return the provider with all values and functions
  return (
    <FileContext.Provider
      value={{
        files,
        folders,
        shareLinks,
        currentPath,
        breadcrumbs,
        selectedItems,
        isLoading,
        uploadProgress,
        error,
        storageUsed,
        storageLimit,
        setCurrentPath,
        createFolder,
        uploadFile,
        deleteItems,
        renameItem,
        toggleSelect,
        clearSelection,
        selectAll,
        starItem,
        shareItem,
        searchItems,
        deleteFile,
        starFile,
        moveToTrash,
        restoreFromTrash,
        emptyTrash,
        getTrashFiles,
        refreshFiles
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export default FileProvider;
