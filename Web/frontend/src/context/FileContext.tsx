import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { FileItem, Folder, ShareLink, BreadcrumbItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './NotificationContext';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import { shareLinkService } from '../services/shareLinkService';
import { normalizeFile } from '../services/fileService';
import { wsClient } from '../utils/websocket';
import UploadProgress from '../components/ui/UploadProgress';
import CacheIndicator from '../components/ui/CacheIndicator';

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
  loadFiles: (path: string) => Promise<void>;
  loadTrashedFiles: () => Promise<void>;
  loadStarredFiles: () => Promise<void>;
  toggleStar: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, newPath: string) => Promise<void>;
  moveFolder: (folderId: string, newPath: string) => Promise<void>;
  deleteFolder: (folderId: string, permanent: boolean) => Promise<void>;
  prefetchData: () => Promise<void>;
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
  loadFiles: async () => {},
  loadTrashedFiles: async () => {},
  loadStarredFiles: async () => {},
  toggleStar: async () => {},
  renameFile: async () => {},
  renameFolder: async () => {},
  moveFile: async () => {},
  moveFolder: async () => {},
  deleteFolder: async () => {},
  prefetchData: async () => {}
});

// Custom hook to use the file context
export const useFiles = () => useContext(FileContext);

// Cache interface for better performance
interface DataCache {
  [path: string]: {
    files: FileItem[];
    folders: Folder[];
    timestamp: number;
    ttl: number;
  };
}

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
  const [uploadProgress, _setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const storageLimit = 1024 * 1024 * 1024; // 1GB

  // Upload progress UI state
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  
  // Cache indicator UI state
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);
  const [cacheIndicatorType, setCacheIndicatorType] = useState<'hit' | 'miss' | 'clear'>('hit');
  const [cacheIndicatorPath, setCacheIndicatorPath] = useState<string>('');

  // Performance optimizations
  const [dataCache, setDataCache] = useState<DataCache>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const loadingQueue = React.useRef<Set<string>>(new Set());
  const cacheTTL = 30000; // 30 seconds cache TTL
  
  // Cache statistics
  const cacheStats = React.useRef({ hits: 0, misses: 0, clears: 0 });

  // Memoize setUploadProgress to prevent lint warnings
  const updateUploadProgress = useCallback((progress: number) => {
    console.log(`📊 Upload progress: ${progress}%`);
    _setUploadProgress(progress);
  }, []);

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

  const breadcrumbs = useMemo(() => getBreadcrumbs(currentPath), [currentPath]);

  // Function to update storage info
  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await getStorageInfo();
      setStorageUsed(info.storageUsed);
    } catch (error) {
      console.error('Error updating storage info:', error);
    }
  }, [getStorageInfo]);

  // Cache management functions with detailed logging
  const getCachedData = useCallback((path: string) => {
    const cached = dataCache[path];
    const now = Date.now();
    
    if (cached && now - cached.timestamp < cached.ttl) {
      const age = Math.round((now - cached.timestamp) / 1000);
      const remaining = Math.round((cached.ttl - (now - cached.timestamp)) / 1000);
      cacheStats.current.hits++;
      console.log(`✅ Cache HIT for "${path}" | Age: ${age}s | Remaining: ${remaining}s | Files: ${cached.files.length} | Folders: ${cached.folders.length} | Total hits: ${cacheStats.current.hits}`);
      
      // Show cache hit indicator
      setCacheIndicatorType('hit');
      setCacheIndicatorPath(path);
      setShowCacheIndicator(true);
      
      return cached;
    }
    
    cacheStats.current.misses++;
    console.log(`❌ Cache MISS for "${path}" | Total misses: ${cacheStats.current.misses}`);
    
    // Show cache miss indicator
    setCacheIndicatorType('miss');
    setCacheIndicatorPath(path);
    setShowCacheIndicator(true);
    
    return null;
  }, [dataCache]);

  const setCachedData = useCallback((path: string, files: FileItem[], folders: Folder[]) => {
    const ttl = cacheTTL;
    console.log(`💾 Caching data for "${path}" | Files: ${files.length} | Folders: ${folders.length} | TTL: ${ttl/1000}s`);
    
    setDataCache(prev => ({
      ...prev,
      [path]: {
        files,
        folders,
        timestamp: Date.now(),
        ttl
      }
    }));
  }, [cacheTTL]);

  const clearCache = useCallback(() => {
    const cachedPaths = Object.keys(dataCache);
    cacheStats.current.clears++;
    console.log(`🗑️ Clearing cache | Paths cleared: ${cachedPaths.length} | ${cachedPaths.join(', ')} | Total clears: ${cacheStats.current.clears}`);
    
    // Show cache clear indicator
    setCacheIndicatorType('clear');
    setCacheIndicatorPath(cachedPaths.join(', ') || 'All');
    setShowCacheIndicator(true);
    
    setDataCache({});
  }, [dataCache]);
  
  // Log cache statistics periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      const totalRequests = cacheStats.current.hits + cacheStats.current.misses;
      const hitRate = totalRequests > 0 ? ((cacheStats.current.hits / totalRequests) * 100).toFixed(1) : '0.0';
      const cachedPaths = Object.keys(dataCache);
      
      if (totalRequests > 0) {
        console.log(`📈 Cache Stats | Hit Rate: ${hitRate}% (${cacheStats.current.hits}/${totalRequests}) | Clears: ${cacheStats.current.clears} | Cached Paths: ${cachedPaths.length}`);
      }
    }, 60000); // Log every 60 seconds
    
    return () => clearInterval(interval);
  }, [dataCache]);

  // Function to refresh files and folders with caching
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
      
      // Cache the results
      setCachedData(currentPath, newFiles, newFolders);
    } catch (error) {
      console.error('Error refreshing files:', error);
      setError('Failed to refresh files');
    } finally {
      setIsLoading(false);
    }
  };

  // Optimized starred files loading with improved persistence and caching
  const loadStarredFiles = useCallback(async () => {
    // Prevent multiple simultaneous loading requests
    if (isLoading || loadingQueue.current.has('starred')) return;
    
    try {
      loadingQueue.current.add('starred');
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const cached = getCachedData('/starred');
      if (cached) {
        setFiles(cached.files);
        setFolders(cached.folders);
        setCurrentPath('/starred');
        return;
      }
      
      // Get starred files - with caching for better performance
      const starredFiles = await fileService.getStarredFiles();
      
      // Only update state if we actually got starred files and are still on the starred page
      if (starredFiles.length > 0 || currentPath === '/starred') {
        // Ensure all files are marked as starred
        const confirmedStarredFiles = starredFiles.map(file => ({
          ...file,
          starred: true // Always force starred to true for consistency
        }));
        
        setFiles(confirmedStarredFiles);
        setFolders([]); // No folders in starred view
        
        // Cache the results
        setCachedData('/starred', confirmedStarredFiles, []);
        
        // Only set path if it's not already set to avoid unnecessary re-renders
        if (currentPath !== '/starred') {
          setCurrentPath('/starred');
        }
      }
    } catch (error) {
      console.error('Failed to load starred files:', error);
      setError('Failed to load starred files');
      
      // Show notification for error
      addNotification({
        type: 'error',
        title: 'Error Loading Starred Files',
        message: 'Could not load your starred files. Please try again later.'
      });
    } finally {
      setIsLoading(false);
      loadingQueue.current.delete('starred');
    }
  }, [isLoading, currentPath, setFiles, setFolders, setCurrentPath, setError, setIsLoading, addNotification, fileService, getCachedData, setCachedData]);

  const loadTrashedFiles = useCallback(async () => {
    if (isLoading || loadingQueue.current.has('trash')) return;
    
    try {
      loadingQueue.current.add('trash');
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const cached = getCachedData('/trash');
      if (cached) {
        setFiles(cached.files);
        setFolders(cached.folders);
        setCurrentPath('/trash');
        return;
      }
      
      const response = await fileService.getTrashedFiles();
      setFiles(response);
      setFolders([]);
      
      // Cache the results
      setCachedData('/trash', response, []);
      
      // Only update path if needed
      if (currentPath !== '/trash') {
        setCurrentPath('/trash');
      }
    } catch (error) {
      console.error('Error loading trashed files:', error);
      setError('Failed to load trashed files');
      addNotification({
        type: 'error',
        title: 'Error Loading Trash',
        message: 'Could not load your trash. Please try again later.'
      });
    } finally {
      setIsLoading(false);
      loadingQueue.current.delete('trash');
    }
  }, [currentPath, setFiles, setFolders, setCurrentPath, setError, setIsLoading, addNotification, fileService, isLoading, getCachedData, setCachedData]);

  // Calculate storage used
  useEffect(() => {
    updateStorageInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // WebSocket connection for real-time storage updates
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    // Connect to WebSocket
    wsClient.connect();

    // Handler for storage updates
    const handleStorageUpdate = (storageData: any) => {
      console.log('📊 Real-time storage update received:', storageData);
      setStorageUsed(storageData.storageUsed);
      
      // Show notification if storage is getting full
      if (storageData.isCriticallyFull) {
        addNotification({
          type: 'error',
          message: `Storage critically full! Only ${formatBytes(storageData.remainingStorage)} remaining.`
        });
      } else if (storageData.isNearlyFull) {
        addNotification({
          type: 'warning',
          message: `Storage is getting full. Only ${formatBytes(storageData.remainingStorage)} remaining.`
        });
      }
    };

    // Register handler
    wsClient.on('storage_update', handleStorageUpdate);

    // Cleanup on unmount
    return () => {
      wsClient.off('storage_update', handleStorageUpdate);
    };
  }, [currentUser, addNotification]);

  // Helper function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Keep track of last load times per path
  const pathLoadTimestamps = React.useRef<Record<string, number>>({});
  
  // Load files and folders for the current path with intelligent throttling and caching
  const loadFiles = useCallback(async (path: string = currentPath) => {
    // Don't make API calls if not authenticated
    if (!currentUser) {
      setFiles([]);
      setFolders([]);
      return;
    }
    
    // Prevent duplicate requests
    if (loadingQueue.current.has(path)) return;
    
    // Implement path-specific throttling to prevent rapid repeated calls
    const now = Date.now();
    const lastLoadTime = pathLoadTimestamps.current[path];
    const loadThrottleMs = 1000; // 1 second minimum between loads for the same path
    
    // Only throttle if we're requesting the same path repeatedly
    if (lastLoadTime && (now - lastLoadTime) < loadThrottleMs) {
      console.log(`Throttling file load for path ${path} - too many requests in short time`);
      return;
    }
    
    // Check cache first
    const cached = getCachedData(path);
    if (cached) {
      setFiles(cached.files);
      setFolders(cached.folders);
      setCurrentPath(path);
      return;
    }
    
    // Update the last load timestamp for this specific path
    pathLoadTimestamps.current[path] = now;
    loadingQueue.current.add(path);

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading files and folders for path:', path);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
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
      
      // Cache the results
      setCachedData(path, validFiles, validFolders);
      
      // Update current path
      setCurrentPath(path);
      
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
      loadingQueue.current.delete(path);
    }
  }, [currentUser, currentPath, setFiles, setFolders, setCurrentPath, setError, setIsLoading, getCachedData, setCachedData, isLoading]);

  // Prefetch data for better performance
  const prefetchData = useCallback(async () => {
    if (!currentUser || isInitialized) return;
    
    try {
      console.log('Prefetching data for better performance...');
      
      // Prefetch common paths in parallel
      const commonPaths = ['/', '/starred', '/trash'];
      const prefetchPromises = commonPaths.map(async (path) => {
        try {
          const [files, folders] = await Promise.all([
            fileService.getFiles(path),
            folderService.getFolders(path)
          ]);
          setCachedData(path, files, folders);
        } catch (error) {
          console.error(`Error prefetching ${path}:`, error);
        }
      });
      
      await Promise.allSettled(prefetchPromises);
      setIsInitialized(true);
      console.log('Data prefetching completed');
    } catch (error) {
      console.error('Error during data prefetching:', error);
    }
  }, [currentUser, isInitialized, setCachedData]);

  // Load files when path changes
  useEffect(() => {
    if (currentUser) {
      loadFiles(currentPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, currentUser]);

  // Initialize data when user logs in
  useEffect(() => {
    if (currentUser && !isInitialized) {
      prefetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isInitialized]);

  // Create a new folder
  const createFolder = async (name: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Creating folder:', { name, path: currentPath });
      
      const newFolder = await folderService.createFolder({ name, path: currentPath, owner: currentUser?.id || '' });
      
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
      
      // Clear cache to ensure fresh data
      clearCache();
      
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
      setIsLoading(true);
      setError(null);
      
      console.log(`📤 Starting upload for "${file.name}" (${(file.size / 1024).toFixed(2)} KB)`);
      
      // Show upload progress UI immediately
      setUploadFileName(file.name);
      setUploadStatus('uploading');
      setShowUploadProgress(true);
      updateUploadProgress(0);
      
      // Small delay to ensure UI renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Upload the file with progress tracking
      await fileService.uploadFile(file, currentPath, (progress) => {
        console.log(`📊 Upload progress callback: ${progress}%`);
        updateUploadProgress(progress);
        if (onProgress) onProgress(progress);
      });
      
      console.log(`✅ Upload completed for "${file.name}"`);
      
      // Clear cache to ensure fresh data
      clearCache();
      await refreshFiles();
      await updateStorageInfo();
      
      // Show success state
      setUploadStatus('success');
      updateUploadProgress(100);
      
      console.log(`✨ Upload success UI showing for "${file.name}"`);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        console.log(`🚮 Hiding upload progress for "${file.name}"`);
        setShowUploadProgress(false);
      }, 3000);
      
      addNotification({
        type: 'success',
        message: `${file.name} uploaded successfully`
      });
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      setError(`Failed to upload ${file.name}`);
      
      // Show error state
      setUploadStatus('error');
      
      console.log(`⚠️ Upload error UI showing for "${file.name}"`);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        console.log(`🚮 Hiding upload error for "${file.name}"`);
        setShowUploadProgress(false);
      }, 5000);
      
      addNotification({
        type: 'error',
        message: `Failed to upload ${file.name}`
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete items with storage update
  const deleteItems = async (items: (FileItem | Folder)[]) => {
    try {
      for (const item of items) {
        if ('type' in item) {
          await fileService.deleteFile(item.id, false);
        } else {
          await folderService.deleteFolder(item.id, false);
        }
      }
      // Clear cache to ensure fresh data
      clearCache();
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
      
      // Clear cache to ensure fresh data
      clearCache();
      
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
      
      const shareLink = await shareLinkService.createShareLink(item.id, isPublic, password, expiry);
      
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



  // This function has been moved to the top of the component


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

      // Clear cache to ensure fresh data
      clearCache();

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

  // Toggle star status with optimistic UI update
  const toggleStar = useCallback(async (fileId: string): Promise<void> => {
    if (!fileId) return;
    
    setIsLoading(true);
    setError(null);
    
    // Find the file in the current files list
    const fileToUpdate = files.find(file => file.id === fileId);
    if (!fileToUpdate) {
      setIsLoading(false);
      return;
    }
    
    // Toggle the starred status locally first for immediate feedback
    const newStarredStatus = !fileToUpdate.starred;
    
    // Update the file in the list immediately (optimistic update)
    if (currentPath === '/starred' && !newStarredStatus) {
      // If we're on starred page and unstarring, remove from list
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } else if (currentPath !== '/starred') {
      // On other pages, just update the file in the list
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, starred: newStarredStatus } : file
      ));
    }
    
    try {
      // Make the actual API call
      await fileService.toggleStar(fileId);
      
      // If we're on the starred page and we just starred a file that wasn't in our list,
      // we should refresh the starred files list
      if (currentPath === '/starred' && newStarredStatus) {
        await loadStarredFiles();
      }
      
      const action = newStarredStatus ? 'added to' : 'removed from';
      addNotification({
        type: 'success',
        message: `File ${action} favorites`,
      });
    } catch (error) {
      console.error('Error toggling star:', error);
      
      // Revert the optimistic update on error
      if (currentPath !== '/starred') {
        // Only revert if we're not on the starred page
        setFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, starred: !newStarredStatus } : file
        ));
      } else if (currentPath === '/starred' && !newStarredStatus) {
        // If we were unstarring on the starred page, add the file back
        await loadStarredFiles();
      }
      
      setError('Failed to update star status');
      addNotification({
        type: 'error',
        message: 'Failed to update star status'
      });
    } finally {
      setIsLoading(false);
    }
  }, [files, currentPath, addNotification, setFiles, setIsLoading, setError, loadStarredFiles]);

  // Star/unstar a file
  const starFile = async (fileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Toggling star for file:', fileId);
      await toggleStar(fileId);
    } catch (error) {
      console.error('Error starring file:', error);
      setError('Failed to update favorites');
      addNotification({
        type: 'error',
        message: 'Failed to update favorites'
      });
    }
  };

  // Rename a file
  const renameFile = async (fileId: string, newName: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Find the file and call renameItem
      const fileToRename = files.find(file => file.id === fileId);
      if (!fileToRename) {
        throw new Error('File not found');
      }
      
      await renameItem(fileToRename, newName);
      
      addNotification({
        type: 'success',
        message: 'File renamed successfully'
      });
    } catch (error: any) {
      console.error('Error renaming file:', error);
      setError(error.message || 'Failed to rename file');
      addNotification({
        type: 'error',
        message: `Failed to rename file: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Rename a folder
  const renameFolder = async (folderId: string, newName: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Find the folder and call renameItem
      const folderToRename = folders.find(folder => folder.id === folderId);
      if (!folderToRename) {
        throw new Error('Folder not found');
      }
      
      await renameItem(folderToRename, newName);
      
      addNotification({
        type: 'success',
        message: 'Folder renamed successfully'
      });
    } catch (error: any) {
      console.error('Error renaming folder:', error);
      setError(error.message || 'Failed to rename folder');
      addNotification({
        type: 'error',
        message: `Failed to rename folder: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Move a file to a different folder
  const moveFile = async (fileId: string, destinationPath: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Implement file moving logic here
      // This would call a fileService.moveFile function
      // For now, we'll just log it
      console.log(`Moving file ${fileId} to ${destinationPath}`);
      
      addNotification({
        type: 'success',
        message: 'File moved successfully'
      });
    } catch (error: any) {
      console.error('Error moving file:', error);
      setError(error.message || 'Failed to move file');
      addNotification({
        type: 'error',
        message: `Failed to move file: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Move a folder to a different location
  const moveFolder = async (folderId: string, destinationPath: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Implement folder moving logic here
      // This would call a folderService.moveFolder function
      // For now, we'll just log it
      console.log(`Moving folder ${folderId} to ${destinationPath}`);
      
      addNotification({
        type: 'success',
        message: 'Folder moved successfully'
      });
    } catch (error: any) {
      console.error('Error moving folder:', error);
      setError(error.message || 'Failed to move folder');
      addNotification({
        type: 'error',
        message: `Failed to move folder: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a folder
  const deleteFolder = async (folderId: string, permanent: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!folderId) {
        throw new Error('Folder ID is required');
      }
      
      await folderService.deleteFolder(folderId, permanent);
      
      // Clear cache to ensure fresh data
      clearCache();
      
      // Update the folders list
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      addNotification({
        type: 'success',
        message: permanent ? 'Folder permanently deleted' : 'Folder moved to trash'
      });
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      setError(error.message || 'Failed to delete folder');
      addNotification({
        type: 'error',
        message: `Failed to delete folder: ${error.message || 'Unknown error'}`
      });
      throw error; // Re-throw to handle in component
    } finally {
      setIsLoading(false);
    }
  };

  // Move a file to trash
  const moveToTrash = async (fileId: string) => {
    try {
      await fileService.moveToTrash(fileId);
      // Clear cache to ensure fresh data is loaded
      clearCache();
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
      
      // Clear cache to ensure fresh data
      clearCache();

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
      // Clear cache to ensure fresh data
      clearCache();
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
  const contextValue = useMemo(() => ({
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
    createFolder: async (name: string) => {
      try {
        await folderService.createFolder({ name, path: currentPath, owner: currentUser?.id || '' });
        await refreshFiles();
        clearCache(); // Clear cache after folder creation
      } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
      }
    },
    uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
      try {
        const result = await fileService.uploadFile(file, currentPath, onProgress);
        await refreshFiles();
        clearCache(); // Clear cache after upload
        return result;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    },
    deleteItems: async (items: (FileItem | Folder)[]) => {
      try {
        for (const item of items) {
          if ('type' in item) {
            await fileService.deleteFile(item.id, false);
          } else {
            await folderService.deleteFolder(item.id, false);
          }
        }
        await refreshFiles();
        clearCache(); // Clear cache after deletion
      } catch (error) {
        console.error('Error deleting items:', error);
        throw error;
      }
    },
    renameItem: async (item: FileItem | Folder, newName: string) => {
      try {
        if ('type' in item) {
          await fileService.renameFile(item.id, newName);
        } else {
          await folderService.renameFolder(item.id, newName);
        }
        await refreshFiles();
        clearCache(); // Clear cache after rename
      } catch (error) {
        console.error('Error renaming item:', error);
        throw error;
      }
    },
    toggleSelect: (item: FileItem | Folder) => {
      setSelectedItems(prev => {
        const isSelected = prev.some(selected => selected.id === item.id);
        if (isSelected) {
          return prev.filter(selected => selected.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    },
    clearSelection: () => setSelectedItems([]),
    selectAll: () => setSelectedItems([...files, ...folders]),
    starItem: async (item: FileItem | Folder) => {
      try {
        if ('type' in item) {
          await fileService.starFile(item.id);
        } else {
          await folderService.starFolder(item.id);
        }
        await refreshFiles();
        clearCache(); // Clear cache after starring
      } catch (error) {
        console.error('Error starring item:', error);
        throw error;
      }
    },
    shareItem: async (item: FileItem | Folder, isPublic: boolean, password?: string, expiry?: Date) => {
      try {
        const shareLink = await shareLinkService.createShareLink(item.id, isPublic, password, expiry);
        return shareLink;
      } catch (error) {
        console.error('Error sharing item:', error);
        throw error;
      }
    },
    searchItems: async (query: string) => {
      try {
        const results = await fileService.searchFiles(query);
        return results;
      } catch (error) {
        console.error('Error searching items:', error);
        throw error;
      }
    },
    deleteFile: async (fileId: string, permanent: boolean) => {
      try {
        await fileService.deleteFile(fileId, permanent);
        await refreshFiles();
        clearCache(); // Clear cache after deletion
      } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
      }
    },
    starFile: async (fileId: string) => {
      try {
        await fileService.starFile(fileId);
        await refreshFiles();
        clearCache(); // Clear cache after starring
      } catch (error) {
        console.error('Error starring file:', error);
        throw error;
      }
    },
    moveToTrash: async (fileId: string) => {
      try {
        await fileService.moveToTrash(fileId);
        await refreshFiles();
        clearCache(); // Clear cache after moving to trash
      } catch (error) {
        console.error('Error moving file to trash:', error);
        throw error;
      }
    },
    restoreFromTrash: async (fileId: string) => {
      try {
        await fileService.restoreFromTrash(fileId);
        await refreshFiles();
        clearCache(); // Clear cache after restoration
      } catch (error) {
        console.error('Error restoring file:', error);
        throw error;
      }
    },
    emptyTrash: async () => {
      try {
        await fileService.emptyTrash();
        await refreshFiles();
        clearCache(); // Clear cache after emptying trash
      } catch (error) {
        console.error('Error emptying trash:', error);
        throw error;
      }
    },
    getTrashFiles: async () => {
      try {
        return await fileService.getTrashedFiles();
      } catch (error) {
        console.error('Error getting trash files:', error);
        throw error;
      }
    },
    refreshFiles,
    loadFiles,
    loadTrashedFiles,
    loadStarredFiles,
    toggleStar: async (fileId: string) => {
      try {
        await fileService.starFile(fileId);
        await refreshFiles();
        clearCache(); // Clear cache after toggling star
      } catch (error) {
        console.error('Error toggling star:', error);
        throw error;
      }
    },
    renameFile: async (fileId: string, newName: string) => {
      try {
        await fileService.renameFile(fileId, newName);
        await refreshFiles();
        clearCache(); // Clear cache after rename
      } catch (error) {
        console.error('Error renaming file:', error);
        throw error;
      }
    },
    renameFolder: async (folderId: string, newName: string) => {
      try {
        await folderService.renameFolder(folderId, newName);
        await refreshFiles();
        clearCache(); // Clear cache after rename
      } catch (error) {
        console.error('Error renaming folder:', error);
        throw error;
      }
    },
    moveFile: async (fileId: string, newPath: string) => {
      try {
        await fileService.moveFile(fileId, newPath);
        await refreshFiles();
        clearCache(); // Clear cache after move
      } catch (error) {
        console.error('Error moving file:', error);
        throw error;
      }
    },
    moveFolder: async (folderId: string, newPath: string) => {
      try {
        await folderService.moveFolder(folderId, newPath);
        await refreshFiles();
        clearCache(); // Clear cache after move
      } catch (error) {
        console.error('Error moving folder:', error);
        throw error;
      }
    },
    deleteFolder: async (folderId: string, permanent: boolean) => {
      try {
        await folderService.deleteFolder(folderId, permanent);
        await refreshFiles();
        clearCache(); // Clear cache after deletion
      } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
      }
    },
    prefetchData
  }), [
    files, folders, shareLinks, currentPath, breadcrumbs, selectedItems, isLoading, 
    uploadProgress, error, storageUsed, storageLimit, currentUser, refreshFiles, 
    loadFiles, loadTrashedFiles, loadStarredFiles, clearCache, prefetchData
  ]);

  return (
    <FileContext.Provider value={contextValue}>
      {children}
      {showUploadProgress && (
        <UploadProgress
          fileName={uploadFileName}
          progress={uploadProgress}
          status={uploadStatus}
          onClose={() => setShowUploadProgress(false)}
        />
      )}
      <CacheIndicator
        show={showCacheIndicator}
        type={cacheIndicatorType}
        path={cacheIndicatorPath}
      />
    </FileContext.Provider>
  );
};

export default FileProvider;
