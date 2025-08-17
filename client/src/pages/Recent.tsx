import React, { useState, useEffect } from 'react';
import { Grid, List, Clock } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import FileCard from '../components/file/FileCard';
import PreviewModal from '../components/modals/PreviewModal';
import { useFiles } from '../context/FileContext';
import { FileItem } from '../types';
import { fileService } from '../services/fileService';

const Recent: React.FC = () => {
  const { deleteFile, starFile } = useFiles();
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const files = await fileService.getRecentFiles();
      setRecentFiles(files);
    } catch (error) {
      console.error('Error loading recent files:', error);
      setError('Failed to load recent files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadRecentFiles();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const files = await fileService.searchFiles(query);
      setRecentFiles(files.filter(file => 'type' in file) as FileItem[]);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('Failed to search files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      await deleteFile(file.id, false);
      setRecentFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleStar = async (file: FileItem) => {
    try {
      await starFile(file.id);
      setRecentFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, starred: !f.starred } : f
      ));
    } catch (error) {
      console.error('Error starring file:', error);
      setError('Failed to star file');
    }
  };

  const handleFileClick = (file: FileItem) => {
    setPreviewFile(file);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
              <Clock className="w-6 h-6 mr-2 text-blue-500" />
              Recent Files
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Recently accessed files and documents
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
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

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No recent files</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Upload a file to see it here.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentFiles.map(file => (
              <FileCard 
                key={file.id}
                file={file}
                viewMode="grid"
                selected={false}
                onSelect={() => handleFileClick(file)}
                onStar={() => handleStar(file)}
                onRename={() => {}}
                onShare={() => {}}
                onDelete={() => handleDelete(file)}
                onDownload={() => {}}
                onClick={() => handleFileClick(file)}
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
                {recentFiles.map(file => (
                  <FileCard 
                    key={file.id}
                    file={file}
                    viewMode="list"
                    selected={false}
                    onSelect={() => handleFileClick(file)}
                    onStar={() => handleStar(file)}
                    onRename={() => {}}
                    onShare={() => {}}
                    onDelete={() => handleDelete(file)}
                    onDownload={() => {}}
                    onClick={() => handleFileClick(file)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </MainLayout>
  );
};

export default Recent; 