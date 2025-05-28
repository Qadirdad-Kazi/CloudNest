import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FileItem, Folder, ShareLink, BreadcrumbItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './NotificationContext';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { shareLinkService } from '../services/shareLinkService';
import axios from '../utils/axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

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

export const useFiles = () => useContext(FileContext);

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
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
  }, [files, storageLimit, addNotification]);

  // Calculate breadcrumbs based on current path
  const breadcrumbs = React.useMemo(() => {
    const pathParts = currentPath.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ name: 'My Drive', path: '/' }];
    
    let currentBuildPath = '';
    pathParts.forEach(part => {
      currentBuildPath += `/${part}`;
      crumbs.push({
        name: part,
        path: currentBuildPath,
      });
    });
    
    return crumbs;
  }, [currentPath]);

  // Load files and folders when path changes
  useEffect(() => {
    if (!user) return;
    
    // Load files when path changes
    loadFiles();
  }, [currentPath, user]);

  const createFolder = async (name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create folder data - only send name and parentPath (not the full path)
      const folderData = {
        name,
        path: currentPath // This is the parent path where the folder should be created
      };
      
      // Call API to create folder using folderService
      const newFolder = await folderService.createFolder(folderData);
      
      // Update state with the new folder from server
      setFolders(prev => [...prev, newFolder]);
      
      // Reload files and folders to ensure everything is in sync with the server
      await loadFiles();
      
      addNotification({
        type: 'success',
        message: `Folder "${name}" created successfully`,
      });
    } catch (err) {
      setError('Failed to create folder');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Creating Folder',
        message: 'Failed to create the folder. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Upload the file using the file service
      const uploadedFile = await fileService.uploadFile(
        file,
        currentPath,
        (progress) => setUploadProgress(progress)
      );
      
      // Update state with the new file
      setFiles(prev => [...prev, uploadedFile]);
      
      addNotification({
        type: 'success',
        message: `File "${file.name}" uploaded successfully`,
      });
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Uploading File',
        message: 'Failed to upload the file. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const deleteItems = async (items: (FileItem | Folder)[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Process files and folders separately
      const fileIds = items
        .filter((item): item is FileItem => 'type' in item)
        .map(file => file.id);
      
      const folderIds = items
        .filter((item): item is Folder => !('type' in item))
        .map(folder => folder.id);
      
      // Delete files
      if (fileIds.length > 0) {
        for (const fileId of fileIds) {
          await fileService.deleteFile(fileId, true); // Skip trash, delete permanently
        }
        
        // Update state
        setFiles(prev => prev.filter(file => !fileIds.includes(file.id)));
      }
      
      // Delete folders
      if (folderIds.length > 0) {
        for (const folderId of folderIds) {
          // Call API to delete folder
          await axios.delete(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.FOLDERS.DELETE}/${folderId}`);
        }
        
        // Update state
        setFolders(prev => prev.filter(folder => !folderIds.includes(folder.id)));
      }
      
      addNotification({
        type: 'success',
        message: `${items.length} item(s) deleted successfully`,
      });
    } catch (err) {
      setError('Failed to delete items');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Deleting Items',
        message: 'Failed to delete the selected items. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renameItem = async (item: FileItem | Folder, newName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if ('type' in item) {
        // It's a file
        // Call API to rename file
        const response = await axios.patch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.LIST}/${item.id}/rename`, {
          newName,
        });
        
        const updatedFile = response.data;
        
        // Update state
        setFiles(prev => prev.map(file => 
          file.id === item.id ? updatedFile : file
        ));
      } else {
        // It's a folder
        // Call API to rename folder
        const response = await axios.patch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.FOLDERS.CREATE}/${item.id}/rename`, {
          newName,
        });
        
        const updatedFolder = response.data;
        
        // Update state
        setFolders(prev => prev.map(folder => 
          folder.id === item.id ? updatedFolder : folder
        ));
      }
      
      addNotification({
        type: 'success',
        message: `Item renamed to "${newName}" successfully`,
      });
    } catch (err) {
      setError('Failed to rename item');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Renaming Item',
        message: 'Failed to rename the item. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (item: FileItem | Folder) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selectedItem => 
        'id' in selectedItem && 'id' in item && selectedItem.id === item.id
      );
      
      if (isSelected) {
        return prev.filter(selectedItem => 
          !('id' in selectedItem && 'id' in item && selectedItem.id === item.id)
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const selectAll = () => {
    const allItems = [...files, ...folders];
    setSelectedItems(allItems);
  };

  const starItem = async (item: FileItem | Folder) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if ('type' in item) {
        // It's a file
        await fileService.starFile(item.id);
        
        // Update state
        setFiles(prev => prev.map(file => 
          file.id === item.id ? { ...file, starred: !file.starred } : file
        ));
      } else {
        // It's a folder
        // Call API to star folder
        const response = await axios.patch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.FOLDERS.CREATE}/${item.id}/star`);
        const updatedFolder = response.data;
        
        // Update state
        setFolders(prev => prev.map(folder => 
          folder.id === item.id ? updatedFolder : folder
        ));
      }
      
      addNotification({
        type: 'success',
        message: `Item ${item.starred ? 'removed from' : 'added to'} starred items`,
      });
    } catch (err) {
      setError('Failed to star item');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Starring Item',
        message: 'Failed to update starred status. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shareItem = async (
    item: FileItem | Folder, 
    isPublic: boolean, 
    password?: string, 
    expiry?: Date
  ): Promise<ShareLink> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API to create share link using shareLinkService
      const shareData = {
        fileId: item.id, // API expects fileId property
        password,
        expiresAt: expiry,
      };
      
      const newShareLink = await shareLinkService.createShareLink(shareData);
      
      setShareLinks(prev => [...prev, newShareLink]);
      
      // Update the item's shared status
      if ('type' in item) { // It's a file
        setFiles(prev => prev.map(file => 
          file.id === item.id 
            ? { ...file, shared: true } 
            : file
        ));
      } else { // It's a folder
        setFolders(prev => prev.map(folder => 
          folder.id === item.id 
            ? { ...folder, shared: true } 
            : folder
        ));
      }

      addNotification({
        type: 'success',
        title: 'Item Shared',
        message: `Share link created${isPublic ? ' (public access)' : ''}`,
      });
      
      return newShareLink;
    } catch (err) {
      setError('Failed to share item');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Sharing Item',
        message: 'Failed to create share link. Please try again.',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchItems = async (query: string): Promise<(FileItem | Folder)[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API to search items
      const response = await axios.get(`${API_CONFIG.BASE_URL}/search`, {
        params: { query }
      });
      
      return response.data;
    } catch (err) {
      setError('Failed to search items');
      console.error(err);
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

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get files for the current path from the server
      try {
        const filesResponse = await fileService.getFiles(currentPath);
        setFiles(Array.isArray(filesResponse) ? filesResponse : []);
        
        // Calculate total storage used from the files we have
        const totalSize = filesResponse.reduce((total, file) => total + file.size, 0);
        setStorageUsed(totalSize);
      } catch (fileError) {
        console.error('Error loading files from server:', fileError);
        setFiles([]);
      }
      
      // Get folders for the current path from the server
      try {
        // Call API to get folders using folderService
        const foldersResponse = await folderService.getFolders(currentPath);
        setFolders(Array.isArray(foldersResponse) ? foldersResponse : []);
      } catch (folderError) {
        console.error('Error loading folders from server:', folderError);
        setFolders([]);
      }
      
      // Get share links from the server
      try {
        // Call API to get share links using shareLinkService
        const shareLinksResponse = await shareLinkService.getShareLinks();
        setShareLinks(Array.isArray(shareLinksResponse) ? shareLinksResponse : []);
      } catch (shareError) {
        console.error('Error loading share links from server:', shareError);
        setShareLinks([]);
      }
    } catch (error) {
      console.error('Error loading files and folders:', error);
      setError('Failed to load your files and folders. Please try again.');
      // Set empty arrays as fallback
      setFiles([]);
      setFolders([]);
      setShareLinks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string, skipTrash: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      await fileService.deleteFile(fileId, skipTrash);
      await loadFiles(); // Reload files after deletion
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

  const starFile = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await fileService.starFile(fileId);
      await loadFiles(); // Reload files after starring
      addNotification({
        type: 'success',
        message: 'File starred successfully',
      });
    } catch (error) {
      console.error('Error starring file:', error);
      setError('Failed to star file');
      addNotification({
        type: 'error',
        message: 'Failed to star file',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Move a file to trash
  const moveToTrash = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await fileService.moveToTrash(fileId);
      
      // Update local state
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, inTrash: true } 
          : file
      ));
      
      addNotification({
        type: 'success',
        message: 'File moved to trash',
      });
    } catch (error) {
      console.error('Error moving file to trash:', error);
      setError('Failed to move file to trash');
      addNotification({
        type: 'error',
        message: 'Failed to move file to trash',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Restore a file from trash
  const restoreFromTrash = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await fileService.restoreFromTrash(fileId);
      
      // Update local state
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, inTrash: false } 
          : file
      ));
      
      addNotification({
        type: 'success',
        message: 'File restored from trash',
      });
    } catch (error) {
      console.error('Error restoring file from trash:', error);
      setError('Failed to restore file from trash');
      addNotification({
        type: 'error',
        message: 'Failed to restore file from trash',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Empty trash (permanently delete all files in trash)
  const emptyTrash = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all files in trash first
      const trashFiles = await getTrashFiles();
      
      // Confirm with the user if there are many files
      if (trashFiles.length > 10) {
        // In a real app, you would show a confirmation dialog here
        console.log(`Warning: About to permanently delete ${trashFiles.length} files`);
      }
      
      // Empty the trash
      await fileService.emptyTrash();
      
      // Update local state
      setFiles(prev => prev.filter(file => !file.inTrash));
      
      addNotification({
        type: 'success',
        message: `${trashFiles.length} file(s) permanently deleted`,
      });
    } catch (error) {
      console.error('Error emptying trash:', error);
      setError('Failed to empty trash');
      addNotification({
        type: 'error',
        message: 'Failed to empty trash',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get all files in trash
  const getTrashFiles = async (): Promise<FileItem[]> => {
    try {
      setIsLoading(true);
      // Get trash files from the server
      const trashFiles = await fileService.getTrashFiles();
      return trashFiles;
    } catch (error) {
      console.error('Error getting trash files:', error);
      setError('Failed to get trash files');
      addNotification({
        type: 'error',
        message: 'Failed to load trash files',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

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
