import React, { useState, useEffect } from 'react';
import { Grid, List, Trash2, AlertCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import FileCard from '../components/file/FileCard';
import { useFiles } from '../context/FileContext';
import { useNotifications } from '../context/NotificationContext';
import { FileItem } from '../types';

const Trash: React.FC = () => {
  const { deleteFile, restoreFromTrash, emptyTrash, getTrashFiles } = useFiles();
  const { addNotification } = useNotifications();
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

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

    // Ask for confirmation before emptying trash
    if (!window.confirm(`Are you sure you want to permanently delete ${trashedFiles.length} file(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      // Delete each file permanently
      for (const file of trashedFiles) {
        const fileId = file.id || (file as any)._id;
        if (!fileId || fileId === 'undefined') {
          console.error('Invalid file object:', file);
          continue;
        }
        await deleteFile(fileId, true); // true for permanent deletion
      }
      setTrashedFiles([]);
      setSelectedFiles([]); // Clear selected files
      addNotification({
        type: 'success',
        message: `Successfully deleted ${trashedFiles.length} file(s) from trash`,
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

  // Add function to handle file selection
  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
              <Trash2 className="w-6 h-6 mr-2 text-red-500" />
              Trash {trashedFiles.length > 0 ? `(${trashedFiles.length} items)` : ''}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Deleted files and folders
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              onClick={handleEmptyTrash}
              disabled={isLoading || trashedFiles.length === 0}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Empty Trash ({trashedFiles.length} items)
            </button>
            
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

        {/* Error state */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : trashedFiles.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Trash is empty</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              No items in trash
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trashedFiles.map(file => (
              <FileCard 
                key={file.id}
                file={file}
                viewMode="grid"
                selected={selectedFiles.includes(file.id || (file as any)._id)}
                onSelect={() => handleFileSelect(file.id || (file as any)._id)}
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
                {trashedFiles.map(file => (
                  <FileCard 
                    key={file.id}
                    file={file}
                    viewMode="list"
                    selected={selectedFiles.includes(file.id || (file as any)._id)}
                    onSelect={() => handleFileSelect(file.id || (file as any)._id)}
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Trash; 