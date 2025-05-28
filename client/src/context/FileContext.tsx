import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileItem, Folder, ShareLink, BreadcrumbItem } from '../types';
import { mockFiles, mockFolders, mockShareLinks } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { fileService } from '../services/fileService';

interface FileContextType {
  files: FileItem[];
  folders: Folder[];
  shareLinks: ShareLink[];
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  selectedItems: (FileItem | Folder)[];
  isLoading: boolean;
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
  deleteFile: (fileId: string) => Promise<void>;
  starFile: (fileId: string) => Promise<void>;
}

const FileContext = createContext<FileContextType>({
  files: [],
  folders: [],
  shareLinks: [],
  currentPath: '/',
  breadcrumbs: [{ name: 'My Drive', path: '/' }],
  selectedItems: [],
  isLoading: false,
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
});

export const useFiles = () => useContext(FileContext);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItems, setSelectedItems] = useState<(FileItem | Folder)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        duration: 10000,
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Filter files and folders based on current path
      const filteredFiles = mockFiles.filter(file => file.path === currentPath);
      const filteredFolders = mockFolders.filter(folder => {
        const folderPathParts = folder.path.split('/').filter(Boolean);
        const currentPathParts = currentPath.split('/').filter(Boolean);
        
        // Check if this folder is directly inside the current path
        if (currentPathParts.length === 0) {
          return folderPathParts.length === 1;
        }
        
        if (folderPathParts.length !== currentPathParts.length + 1) {
          return false;
        }
        
        for (let i = 0; i < currentPathParts.length; i++) {
          if (folderPathParts[i] !== currentPathParts[i]) {
            return false;
          }
        }
        
        return true;
      });
      
      setFiles(filteredFiles);
      setFolders(filteredFolders);
      setShareLinks(mockShareLinks);
    } catch (err) {
      setError('Failed to load files and folders');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Loading Files',
        message: 'Failed to load your files and folders. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, user, addNotification]);

  const createFolder = async (name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name,
        path: currentPath === '/' ? `/${name}` : `${currentPath}/${name}`,
        owner: user?.id || '',
        shared: false,
        starred: false,
        tags: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };
      
      setFolders(prev => [...prev, newFolder]);
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
    try {
    setIsLoading(true);
    setError(null);
      await fileService.uploadFile(file, currentPath);
      await loadFiles(); // Reload files after upload
      addNotification({
        type: 'success',
        message: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      addNotification({
        type: 'error',
        message: `Failed to upload ${file.name}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItems = async (items: (FileItem | Folder)[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const fileIds = new Set(items.filter(item => 'type' in item).map(item => item.id));
      const folderIds = new Set(items.filter(item => !('type' in item)).map(item => item.id));
      
      setFiles(prev => prev.filter(file => !fileIds.has(file.id)));
      setFolders(prev => prev.filter(folder => !folderIds.has(folder.id)));
      setSelectedItems([]);

      addNotification({
        type: 'success',
        message: `${items.length} item${items.length === 1 ? '' : 's'} moved to trash`,
      });
    } catch (err) {
      setError('Failed to delete items');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Deleting Items',
        message: 'Failed to move items to trash. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renameItem = async (item: FileItem | Folder, newName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if ('type' in item) { // It's a file
        setFiles(prev => prev.map(file => 
          file.id === item.id 
            ? { ...file, name: newName, modifiedAt: new Date().toISOString() } 
            : file
        ));
      } else { // It's a folder
        setFolders(prev => prev.map(folder => 
          folder.id === item.id 
            ? { ...folder, name: newName, modifiedAt: new Date().toISOString() } 
            : folder
        ));
      }

      addNotification({
        type: 'success',
        message: `Renamed to "${newName}" successfully`,
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
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const selectAll = () => {
    setSelectedItems([...files, ...folders]);
  };

  const starItem = async (item: FileItem | Folder) => {
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if ('type' in item) { // It's a file
        setFiles(prev => prev.map(file => 
          file.id === item.id 
            ? { ...file, starred: !file.starred } 
            : file
        ));
      } else { // It's a folder
        setFolders(prev => prev.map(folder => 
          folder.id === item.id 
            ? { ...folder, starred: !folder.starred } 
            : folder
        ));
      }

      addNotification({
        type: 'success',
        message: `${item.starred ? 'Removed from' : 'Added to'} starred items`,
      });
    } catch (err) {
      setError('Failed to star item');
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Error Starring Item',
        message: 'Failed to update starred status. Please try again.',
      });
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
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newShareLink: ShareLink = {
        id: `share-${Date.now()}`,
        fileId: item.id,
        url: `https://cloudrive.com/s/${Math.random().toString(36).substring(2, 10)}`,
        isPublic,
        password,
        expiresAt: expiry?.toISOString(),
        createdAt: new Date().toISOString(),
      };
      
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
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const lowercaseQuery = query.toLowerCase();
      
      const matchingFiles = mockFiles.filter(file => 
        file.name.toLowerCase().includes(lowercaseQuery) || 
        file.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
      
      const matchingFolders = mockFolders.filter(folder => 
        folder.name.toLowerCase().includes(lowercaseQuery) || 
        folder.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
      
      return [...matchingFiles, ...matchingFolders];
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
      const files = await fileService.getFiles(currentPath);
      setFiles(files);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
      addNotification({
        type: 'error',
        message: 'Failed to load files',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await fileService.deleteFile(fileId);
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
      }}
    >
      {children}
    </FileContext.Provider>
  );
};