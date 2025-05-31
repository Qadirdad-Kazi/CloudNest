import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { FileItem, Folder, ShareLink, BreadcrumbItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './NotificationContext';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { shareLinkService } from '../services/shareLinkService';

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
  uploadFile: (file: File) => Promise<void>;
  deleteItems: (items: (FileItem | Folder)[]) => Promise<void>;
  renameItem: (item: FileItem | Folder, newName: string) => Promise<void>;
  toggleSelect: (item: FileItem | Folder) => void;
  clearSelection: () => void;
  selectAll: () => void;
  starItem: (item: FileItem | Folder) => Promise<void>;
  shareItem: (item: FileItem | Folder, isPublic: boolean, password?: string, expiry?: Date) => Promise<ShareLink>;
  searchItems: (query: string) => Promise<(FileItem | Folder)[]>;
  deleteFile: (fileId: string, skipTrash?: boolean) => Promise<void>;
  starFile: (fileId: string) => Promise<void>;
  moveToTrash: (fileId: string) => Promise<void>;
  restoreFromTrash: (fileId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  getTrashFiles: () => Promise<FileItem[]>;
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
});

// Custom hook to use the file context
export const useFiles = () => useContext(FileContext);

// Provider component
export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth(); // Renamed to currentUser to avoid unused variable warning
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

  // Calculate storage used
  useEffect(() => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    setStorageUsed(totalSize);

    // Check if storage is almost full (90% or more)
    if (totalSize >= storageLimit * 0.9) {
      addNotification({
        type: 'warning',
        title: 'Storage Almost Full',
        message: 'You are running out of storage space. Consider upgrading your plan or deleting unnecessary files.',
      });
    }
  }, [files, addNotification]);

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

  // Upload a file
  const uploadFile = async (file: File): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);
      
      console.log(`Uploading file to path: "${currentPath}"`);
      
      const uploadedFile = await fileService.uploadFile(file, currentPath, (progress) => {
        setUploadProgress(progress);
      });
      
      console.log('File uploaded successfully:', uploadedFile);
      
      setFiles(prev => [...prev, uploadedFile]);
      
      addNotification({
        type: 'success',
        message: `File "${file.name}" uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      addNotification({
        type: 'error',
        message: 'Failed to upload file',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Delete multiple items (files and/or folders)
  const deleteItems = async (items: (FileItem | Folder)[]): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fileIds = items
        .filter(item => 'type' in item) // Only files have a 'type' property
        .map(item => item.id);
      
      const folderIds = items
        .filter(item => !('type' in item)) // Folders don't have a 'type' property
        .map(item => item.id);
      
      if (fileIds.length > 0) {
        await Promise.all(fileIds.map(id => fileService.deleteFile(id)));
        setFiles(prev => prev.filter(file => !fileIds.includes(file.id)));
      }
      
      if (folderIds.length > 0) {
        await Promise.all(folderIds.map(id => folderService.deleteFolder(id)));
        setFolders(prev => prev.filter(folder => !folderIds.includes(folder.id)));
      }
      
      addNotification({
        type: 'success',
        message: `${items.length} item(s) deleted successfully`,
      });
      
      // Clear selection after deleting
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting items:', error);
      setError('Failed to delete items');
      addNotification({
        type: 'error',
        message: 'Failed to delete items',
      });
    } finally {
      setIsLoading(false);
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
      
      if ('type' in item) {
        // It's a file
        const updatedFile = await fileService.starFile(item.id);
        setFiles(prev => prev.map(file => 
          file.id === item.id ? updatedFile : file
        ));
      } else {
        // It's a folder
        // Since folderService doesn't have a toggleStar method, we need to implement a workaround
        // For now, we'll just update the local state
        // TODO: Implement proper folder starring functionality on the backend
        const updatedFolder = { ...item, starred: !item.starred };
        setFolders(prev => prev.map(folder => 
          folder.id === item.id ? updatedFolder : folder
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

  // Load files and folders for the current path
  const loadFiles = async (path: string = currentPath) => {
    // Don't make API calls if not authenticated
    if (!currentUser) {
      setFiles([]);
      setFolders([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading files and folders for path:', path);
      
      const [filesResponse, foldersResponse] = await Promise.all([
        fileService.getFiles(path),
        folderService.getFolders(path)
      ]);
      
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
      setError('Failed to load files and folders');
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
  const deleteFile = async (fileId: string, skipTrash = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (skipTrash) {
        // Permanently delete the file
        await fileService.deleteFile(fileId);
      } else {
        // Move to trash
        await moveToTrash(fileId);
        return;
      }
      
      // Update local state
      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      addNotification({
        type: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
      addNotification({
        type: 'error',
        message: 'Failed to delete file',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Star/unstar a file
  const starFile = async (fileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedFile = await fileService.toggleStar(fileId);
      
      // Update local state
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? updatedFile 
          : file
      ));
      
      const action = updatedFile.starred ? 'added to' : 'removed from';
      
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
  const restoreFromTrash = async (fileId: string) => {
    try {
      await fileService.restoreFromTrash(fileId);
      await loadTrashedFiles();
    } catch (error) {
      console.error('Error restoring file from trash:', error);
      throw new Error('Failed to restore file from trash');
    }
  };

  // Empty trash (permanently delete all files in trash)
  const emptyTrash = async () => {
    try {
      await fileService.emptyTrash();
      await loadTrashedFiles();
    } catch (error) {
      console.error('Error emptying trash:', error);
      throw new Error('Failed to empty trash');
    }
  };

  // Get all files in trash
  const getTrashFiles = async (): Promise<FileItem[]> => {
    try {
      setIsLoading(true);
      
      // Try to get trash files from the server
      let serverTrashFiles: FileItem[] = [];
      try {
        serverTrashFiles = await fileService.getTrashedFiles();
        console.log('Server trash files:', serverTrashFiles);
      } catch (serverError) {
        console.warn('Could not fetch trash files from server, using local data:', serverError);
      }
      
      // Also get any locally stored trash files
      const storedTrashedFiles = localStorage.getItem('trashedFiles');
      const localTrashFiles: FileItem[] = storedTrashedFiles ? JSON.parse(storedTrashedFiles) : [];
      console.log('Local trash files:', localTrashFiles);
      
      // Merge server and local trash files, removing duplicates
      const allTrashFiles = [...serverTrashFiles];
      
      // Add local trash files that aren't already in the server list
      localTrashFiles.forEach(localFile => {
        if (!allTrashFiles.some(file => file.id === localFile.id)) {
          allTrashFiles.push(localFile);
        }
      });
      
      console.log('All trash files:', allTrashFiles);
      return allTrashFiles;
    } catch (error) {
      console.error('Error getting trash files:', error);
      setError('Failed to get trash files');
      addNotification({
        type: 'error',
        message: 'Failed to load trash files',
      });
      
      // Try to return local trash files as fallback
      try {
        const storedTrashedFiles = localStorage.getItem('trashedFiles');
        return storedTrashedFiles ? JSON.parse(storedTrashedFiles) : [];
      } catch (localError) {
        console.error('Error getting local trash files:', localError);
        return [];
      }
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
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export default FileProvider;
