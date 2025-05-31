import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FolderPlus, 
  Trash2, 
  Grid, 
  List, 
  ChevronRight 
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
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
  
  const handleFolderClick = (folder: Folder) => {
    console.log('Folder clicked:', folder);
    // First set the current path, which will trigger the useEffect to load files
    setCurrentPath(folder.path);
    // Clear any search results when navigating
    setIsSearching(false);
    setSearchResults([]);
    setSearchQuery('');
    // Clear selection when navigating
    clearSelection();
  };
  
  const handleFileClick = async (file: FileItem) => {
    try {
      if (file.mongodbId) {
        // MongoDB document
        const documentBlob = await mongodbService.getDocument(file.mongodbId);
        const url = URL.createObjectURL(documentBlob);
        setPreviewFile({ ...file, url });
      } else {
        // For other files, just show preview
        setPreviewFile(file);
      }
    } catch (error) {
      console.error('Error handling file click:', error);
      addNotification({
        type: 'error',
        message: 'Failed to open file. Please try again.',
        title: 'Error'
      });
    }
  };
  
  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
  };
  
  const handleCreateFolderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowCreateFolder(true);
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar activeItem={activeSection} onItemClick={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={handleSearch} 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          {/* Breadcrumbs */}
          <div className="flex items-center mb-4">
            {breadcrumbs.map((crumb: BreadcrumbItem, index: number) => (
              <React.Fragment key={crumb.path}>
                <button 
                  className="text-sm hover:text-indigo-600 dark:hover:text-indigo-400"
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div className="flex space-x-2">
              <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
                <Upload className="w-5 h-5 mr-2" />
                <span>Upload</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleUpload}
                  multiple
                />
              </label>
              
              <button 
                className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={handleCreateFolderClick}
              >
                <FolderPlus className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Create Folder
              </button>
              
              {selectedItems.length > 0 && (
                <button 
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  onClick={() => deleteItems(selectedItems)}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Create folder dialog */}
          {showCreateFolder && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-2">Create New Folder</h3>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="Folder name" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  onClick={() => {
                    handleCreateFolder(newFolderName.trim());
                    setNewFolderName('');
                    setShowCreateFolder(false);
                  }}
                >
                  Create
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowCreateFolder(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Rename dialog */}
          {showRenameDialog && itemToRename && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-2">Rename Item</h3>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="New name" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  onClick={handleRename}
                >
                  Rename
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowRenameDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Search results or files/folders */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : isSearching ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results for "{searchQuery}"</h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No results found</p>
                </div>
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
        </main>
      </div>
      
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
    </div>
  );
};

export default Dashboard;