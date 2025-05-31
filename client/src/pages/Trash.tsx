import React, { useState, useEffect } from 'react';
import { Grid, List, Trash2, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FileCard from '../components/file/FileCard';
import { useFiles } from '../context/FileContext';
import { useNotifications } from '../context/NotificationContext';
import { FileItem } from '../types';

const Trash: React.FC = () => {
  const { deleteFile, restoreFromTrash, emptyTrash, getTrashFiles } = useFiles();
  const { addNotification } = useNotifications();
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrashedFiles();
  }, []);

  const loadTrashedFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const files = await getTrashFiles();
      setTrashedFiles(Array.isArray(files) ? files : []);
    } catch (error) {
      console.error('Error loading trashed files:', error);
      setError('Failed to load trashed files');
      addNotification({
        type: 'error',
        message: 'Failed to load trashed files',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadTrashedFiles();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const files = await getTrashFiles();
      const filteredFiles = (Array.isArray(files) ? files : []).filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase())
      );
      setTrashedFiles(filteredFiles);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('Failed to search files');
      addNotification({
        type: 'error',
        message: 'Failed to search files',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (file: FileItem | any) => {
    try {
      const fileId = file.id || file._id;
      if (!file || !fileId || fileId === 'undefined') {
        console.error('Invalid file object:', file);
        addNotification({
          type: 'error',
          message: `Cannot restore file: Invalid file ID`,
        });
        return;
      }

      setIsLoading(true);
      console.log('Attempting to restore file:', { id: fileId, file });
      await restoreFromTrash(fileId.toString());
      setTrashedFiles(prev => prev.filter(f => (f.id || (f as any)._id) !== fileId));
      addNotification({
        type: 'success',
        message: `Restored ${file.name}`,
      });
    } catch (error: any) {
      console.error('Error restoring file:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      addNotification({
        type: 'error',
        message: `Failed to restore ${file.name}: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!file.id) {
      addNotification({
        type: 'error',
        message: 'Invalid file ID',
      });
      return;
    }

    try {
      await deleteFile(file.id, true); // true for permanent deletion
      setTrashedFiles(prev => prev.filter(f => f.id !== file.id));
      addNotification({
        type: 'success',
        message: `Permanently deleted ${file.name}`,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      addNotification({
        type: 'error',
        message: `Failed to delete ${file.name}`,
      });
    }
  };

  const handleEmptyTrash = async () => {
    if (trashedFiles.length === 0) {
      addNotification({
        type: 'info',
        message: 'Trash is already empty',
      });
      return;
    }

    try {
      setIsLoading(true);
      await emptyTrash();
      setTrashedFiles([]);
      addNotification({
        type: 'success',
        message: 'Trash emptied successfully',
      });
    } catch (error) {
      console.error('Error emptying trash:', error);
      addNotification({
        type: 'error',
        message: 'Failed to empty trash',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeItem="trash" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={handleSearch} 
          darkMode={darkMode} 
          toggleDarkMode={() => setDarkMode(!darkMode)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          {/* Action buttons */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Trash</h1>
            
            <div className="flex space-x-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                onClick={handleEmptyTrash}
                disabled={isLoading || trashedFiles.length === 0}
              >
                <div className="flex items-center">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Empty Trash
                </div>
              </button>
              
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
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && trashedFiles.length === 0 && (
            <div className="text-center py-12">
              <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Trash is empty</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                No items in trash
              </p>
            </div>
          )}

          {/* File grid */}
          {!isLoading && !error && trashedFiles.length > 0 && (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {trashedFiles.map(file => (
                  <FileCard 
                    key={file.id}
                    file={file}
                    selected={false}
                    onSelect={() => {}}
                    onStar={() => {}}
                    onRename={() => {}}
                    onShare={() => {}}
                    onDelete={() => handleDelete(file)}
                    onRestore={handleRestore}
                    onDownload={() => {}}
                    onClick={() => {}}
                    isInTrash={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr key="header-row">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Modified
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {trashedFiles.map(file => (
                      <tr key={file.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {/* File icon would go here */}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {file.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {(file.size / 1024).toFixed(2)} KB
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <React.Fragment key={`actions-${file.id}`}>
                            <button
                              onClick={() => handleRestore(file)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDelete(file)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </React.Fragment>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default Trash; 