import React, { useState, useEffect } from 'react';
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
    refreshFiles
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
  }, [activeSection, setCurrentPath]);
  
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
      refreshFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      addNotification({
        type: 'error',
        message: 'Failed to create folder. Please try again.',
        title: 'Error'
      });
    }
  };
  
  const handleRename = () => {
    if (itemToRename && newName.trim()) {
      renameItem(itemToRename, newName);
      setShowRenameDialog(false);
      setItemToRename(null);
      setNewName('');
      addNotification({
        type: 'success',
        message: `Renamed ${itemToRename?.name} to ${newName}`,
        title: 'Success'
      });
      refreshFiles();
    }
  };
  
  const handleShare = (isPublic: boolean, password?: string, expiry?: Date) => {
    if (itemToShare) {
      shareItem(itemToShare, isPublic, password, expiry)
        .then((link: ShareLink) => {
          setShareLink(link);
          addNotification({
            type: 'success',
            message: `Shared ${itemToShare.name}`,
            title: 'Success'
          });
        })
        .catch((err: Error) => {
          console.error('Error sharing item:', err);
          addNotification({
            type: 'error',
            message: 'Failed to share item. Please try again.',
            title: 'Error'
          });
        });
    }
  };
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const uploadNotificationId = `upload-${Date.now()}-${file.name}`;
      try {
        // Initial upload notification
        addNotification({
          id: uploadNotificationId,
          type: 'info',
          message: `Uploading ${file.name}...`,
          title: 'Upload in Progress',
          progress: 0
        });

        // Upload with progress tracking
        await uploadFile(file, (progress: number) => {
          addNotification({
            id: uploadNotificationId,
            type: 'info',
            message: `Uploading ${file.name}...`,
            title: 'Upload in Progress',
            progress: progress
          });
        });

        // Success notification
        addNotification({
          id: uploadNotificationId,
          type: 'success',
          message: `Successfully uploaded ${file.name}`,
          title: 'Upload Complete',
          progress: 100
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        addNotification({
          id: uploadNotificationId,
          type: 'error',
          message: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : 'Please try again.'}`,
          title: 'Upload Error'
        });
      }
    }
    
    // Clear the input
    event.target.value = '';
    refreshFiles();
  };

  const handleFileClick = (file: FileItem) => {
    // Handle file click - could open preview, download, etc.
    console.log('File clicked:', file);
    setPreviewFile(file);
  };

  const handleFolderClick = (folder: Folder) => {
    setCurrentPath(folder.path);
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
            <p className="text-gray-600 dark:text-gray-400">Manage your files and folders</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        {breadcrumbs.length > 1 && (
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.path} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
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
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            New Folder
          </button>
          
          <label className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
            <Upload className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Upload Files
            <input 
              type="file" 
              className="hidden" 
              onChange={handleUpload}
              multiple
            />
          </label>
          
          {selectedItems.length > 0 && (
            <button
              onClick={() => deleteItems(selectedItems)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Selected ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        ) : (
          <div>
            {isSearching ? (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Search Results for "{searchQuery}"
                </h2>
                {searchResults.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No results found.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.map(item => 
                      'type' in item ? (
                        <FileCard 
                          key={`file-${item.id}`}
                          file={item as FileItem}
                          selected={selectedItems.some((selected: FileItem | Folder) => selected.id === item.id)}
                          onSelect={toggleSelect}
                          onStar={starItem}
                          onRename={(file) => {
                            setItemToRename(file);
                            setNewName(file.name);
                            setShowRenameDialog(true);
                          }}
                          onShare={(file) => {
                            setItemToShare(file);
                            setShareLink(null);
                            setShowShareModal(true);
                          }}
                          onDelete={(file) => deleteItems([file])}
                          onDownload={() => {}}
                          onClick={handleFileClick}
                        />
                      ) : (
                        <FolderCard 
                          key={`folder-${item.id}`}
                          folder={item as Folder}
                          selected={selectedItems.some((selected: FileItem | Folder) => selected.id === item.id)}
                          onSelect={toggleSelect}
                          onStar={starItem}
                          onRename={(folder) => {
                            setItemToRename(folder);
                            setNewName(folder.name);
                            setShowRenameDialog(true);
                          }}
                          onShare={(folder) => {
                            setItemToShare(folder);
                            setShareLink(null);
                            setShowShareModal(true);
                          }}
                          onDelete={(folder) => deleteItems([folder])}
                          onClick={handleFolderClick}
                        />
                      )
                    )}
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
                            Location
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Modified
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Table rows would go here */}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Empty state */}
                {folders.length === 0 && files.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderPlus className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No items</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Get started by creating a new folder or uploading a file.
                    </p>
                    <div className="mt-6 flex justify-center space-x-4">
                      <button 
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        onClick={() => setShowCreateFolder(true)}
                      >
                        <FolderPlus className="w-5 h-5 mr-2" />
                        <span>New Folder</span>
                      </button>
                      
                      <label className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <Upload className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                        <span>Upload</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleUpload}
                          multiple
                        />
                      </label>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {folders.map((folder: Folder) => (
                      <FolderCard 
                        key={`folder-${folder.id}`}
                        folder={folder}
                        selected={selectedItems.some((item: FileItem | Folder) => item.id === folder.id)}
                        onSelect={toggleSelect}
                        onStar={starItem}
                        onRename={(folder) => {
                          setItemToRename(folder);
                          setNewName(folder.name);
                          setShowRenameDialog(true);
                        }}
                        onShare={(folder) => {
                          setItemToShare(folder);
                          setShareLink(null);
                          setShowShareModal(true);
                        }}
                        onDelete={(folder) => deleteItems([folder])}
                        onClick={handleFolderClick}
                      />
                    ))}
                    
                    {files.map((file: FileItem) => (
                      <FileCard 
                        key={`file-${file.id}`}
                        file={file}
                        selected={selectedItems.some((item: FileItem | Folder) => item.id === file.id)}
                        onSelect={toggleSelect}
                        onStar={starItem}
                        onRename={(file) => {
                          setItemToRename(file);
                          setNewName(file.name);
                          setShowRenameDialog(true);
                        }}
                        onShare={(file) => {
                          setItemToShare(file);
                          setShareLink(null);
                          setShowShareModal(true);
                        }}
                        onDelete={(file) => deleteItems([file])}
                        onDownload={() => {}}
                        onClick={handleFileClick}
                      />
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
                        {folders.map((folder: Folder) => (
                          <FolderCard 
                            key={`folder-${folder.id}`}
                            folder={folder}
                            viewMode="list"
                            selected={selectedItems.some((item: FileItem | Folder) => item.id === folder.id)}
                            onSelect={toggleSelect}
                            onStar={starItem}
                            onRename={(folder) => {
                              setItemToRename(folder);
                              setNewName(folder.name);
                              setShowRenameDialog(true);
                            }}
                            onShare={(folder) => {
                              setItemToShare(folder);
                              setShareLink(null);
                              setShowShareModal(true);
                            }}
                            onDelete={(folder) => deleteItems([folder])}
                            onClick={handleFolderClick}
                          />
                        ))}
                        
                        {files.map((file: FileItem) => (
                          <FileCard 
                            key={`file-${file.id}`}
                            file={file}
                            viewMode="list"
                            selected={selectedItems.some((item: FileItem | Folder) => item.id === file.id)}
                            onSelect={toggleSelect}
                            onStar={starItem}
                            onRename={(file) => {
                              setItemToRename(file);
                              setNewName(file.name);
                              setShowRenameDialog(true);
                            }}
                            onShare={(file) => {
                              setItemToShare(file);
                              setShareLink(null);
                              setShowShareModal(true);
                            }}
                            onDelete={(file) => deleteItems([file])}
                            onDownload={() => {}}
                            onClick={handleFileClick}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder(newFolderName)}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateFolder(newFolderName)}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rename Item</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowRenameDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setItemToShare(null);
          setShareLink(null);
        }}
        onShare={handleShare}
        itemName={itemToShare?.name || ''}
        shareLink={shareLink?.url}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </MainLayout>
  );
};

export default Dashboard;