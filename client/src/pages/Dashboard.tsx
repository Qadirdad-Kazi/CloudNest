import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, 
  FolderPlus, 
  Trash2, 
  Grid, 
  List, 
  ChevronRight 
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import FileCard from '../components/file/FileCard';
import FolderCard from '../components/file/FolderCard';
import ShareModal from '../components/modals/ShareModal';
import PreviewModal from '../components/modals/PreviewModal';
import LoadingOptimizer from '../components/ui/LoadingOptimizer';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../context/FileContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { FileItem, Folder, ShareLink, BreadcrumbItem } from '../types';
import { mongodbService } from '../services/mongodbService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { darkMode, toggleDarkMode } = useTheme();
  const { 
    files,
    folders,
    currentPath,
    breadcrumbs,
    selectedItems,
    isLoading,
    error,
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
    refreshFiles,
    prefetchData
  } = useFiles();
  
  const [activeSection, setActiveSection] = useState('my-drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | Folder | null>(null);
  const [newName, setNewName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [itemToShare, setItemToShare] = useState<FileItem | Folder | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<FileItem | Folder>>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  // Memoize filtered data to prevent unnecessary re-renders
  const filteredData = useMemo(() => {
    if (isSearching && searchQuery.trim()) {
      return searchResults;
    }
    return [...folders, ...files];
  }, [isSearching, searchQuery, searchResults, folders, files]);

  // Reset state when switching sections
  useEffect(() => {
    clearSelection();
    setShowCreateFolder(false);
    setShowRenameDialog(false);
    setShowShareModal(false);
    setIsSearching(false);
    setSearchQuery('');
    
    // Set the appropriate path based on active section
    if (activeSection === 'my-drive') {
      setCurrentPath('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);
  
  // Prefetch data on component mount for better performance
  useEffect(() => {
    if (user) {
      prefetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      const results = await searchItems(query);
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };
  
  const handleCreateFolder = async (folderName: string) => {
    try {
      await createFolder(folderName);
      setNewFolderName('');
      setShowCreateFolder(false);
      addNotification({
        type: 'success',
        message: `Created folder ${folderName}`,
        title: 'Success'
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      addNotification({
        type: 'error',
        message: 'Failed to create folder',
        title: 'Error'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    try {
      // Upload file (progress is handled by FileContext)
      await uploadFile(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    
    // Reset the input
    event.target.value = '';
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    try {
      await deleteItems(selectedItems);
      clearSelection();
      addNotification({
        type: 'success',
        message: `Deleted ${selectedItems.length} item(s)`,
        title: 'Success'
      });
    } catch (error) {
      console.error('Error deleting items:', error);
      addNotification({
        type: 'error',
        message: 'Failed to delete items',
        title: 'Error'
      });
    }
  };

  const handleRename = async () => {
    if (!itemToRename || !newName.trim()) return;

    try {
      await renameItem(itemToRename, newName.trim());
      setShowRenameDialog(false);
      setItemToRename(null);
      setNewName('');
      addNotification({
        type: 'success',
        message: `Renamed to ${newName.trim()}`,
        title: 'Success'
      });
    } catch (error) {
      console.error('Error renaming item:', error);
      addNotification({
        type: 'error',
        message: 'Failed to rename item',
        title: 'Error'
      });
    }
  };

  const handleShare = async (item: FileItem | Folder) => {
    setItemToShare(item);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (isPublic: boolean, password?: string, expiry?: Date) => {
    if (!itemToShare) return;

    try {
      const link = await shareItem(itemToShare, isPublic, password, expiry);
      setShareLink(link);
      addNotification({
        type: 'success',
        message: 'Share link created successfully',
        title: 'Success'
      });
    } catch (error) {
      console.error('Error creating share link:', error);
      addNotification({
        type: 'error',
        message: 'Failed to create share link',
        title: 'Error'
      });
    }
  };

  const handleFileClick = (file: FileItem) => {
    setPreviewFile(file);
  };

  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    setCurrentPath(breadcrumb.path);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Drive</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your files and folders
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.path} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                <button
                  onClick={() => handleBreadcrumbClick(breadcrumb)}
                  className={`text-sm font-medium ${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {breadcrumb.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />
          </label>
          
          <button
            onClick={() => setShowCreateFolder(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Create Folder
          </button>
          
          {selectedItems.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Content */}
        <LoadingOptimizer isLoading={isLoading} type="files" error={error}>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No files</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by uploading a file or creating a folder.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredData.map(item => (
                'type' in item ? (
                  <FileCard 
                    key={item.id}
                    file={item}
                    viewMode="grid"
                    selected={selectedItems.some(selected => selected.id === item.id)}
                    onSelect={() => toggleSelect(item)}
                    onStar={() => starItem(item)}
                    onRename={() => {
                      setItemToRename(item);
                      setNewName(item.name);
                      setShowRenameDialog(true);
                    }}
                    onShare={() => handleShare(item)}
                    onDelete={() => deleteItems([item])}
                    onDownload={() => {}}
                    onClick={() => handleFileClick(item)}
                  />
                ) : (
                  <FolderCard 
                    key={item.id}
                    folder={item}
                    viewMode="grid"
                    selected={selectedItems.some(selected => selected.id === item.id)}
                    onSelect={() => toggleSelect(item)}
                    onStar={() => starItem(item)}
                    onRename={() => {
                      setItemToRename(item);
                      setNewName(item.name);
                      setShowRenameDialog(true);
                    }}
                    onShare={() => handleShare(item)}
                    onDelete={() => deleteItems([item])}
                    onClick={() => setCurrentPath(item.path)}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map(item => (
                    'type' in item ? (
                      <FileCard 
                        key={item.id}
                        file={item}
                        viewMode="list"
                        selected={selectedItems.some(selected => selected.id === item.id)}
                        onSelect={() => toggleSelect(item)}
                        onStar={() => starItem(item)}
                        onRename={() => {
                          setItemToRename(item);
                          setNewName(item.name);
                          setShowRenameDialog(true);
                        }}
                        onShare={() => handleShare(item)}
                        onDelete={() => deleteItems([item])}
                        onDownload={() => {}}
                        onClick={() => handleFileClick(item)}
                      />
                    ) : (
                      <FolderCard 
                        key={item.id}
                        folder={item}
                        viewMode="list"
                        selected={selectedItems.some(selected => selected.id === item.id)}
                        onSelect={() => toggleSelect(item)}
                        onStar={() => starItem(item)}
                        onRename={() => {
                          setItemToRename(item);
                          setNewName(item.name);
                          setShowRenameDialog(true);
                        }}
                        onShare={() => handleShare(item)}
                        onDelete={() => deleteItems([item])}
                        onClick={() => setCurrentPath(item.path)}
                      />
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LoadingOptimizer>
      </div>

      {/* Modals */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder(newFolderName)}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateFolder(newFolderName)}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameDialog && itemToRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rename Item</h3>
            <input
              type="text"
              placeholder="New name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRenameDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSubmit={handleShareSubmit}
        shareLink={shareLink}
      />

      <PreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </MainLayout>
  );
};

export default Dashboard;