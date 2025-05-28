import React, { useState, useEffect } from 'react';
import { Grid, List } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FileCard from '../components/file/FileCard';
import { useFiles } from '../context/FileContext';
import { FileItem } from '../types';
import { fileService } from '../services/fileService';

const Recent: React.FC = () => {
  const { deleteFile, starFile } = useFiles();
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const files = await fileService.getRecentFiles();
      const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase())
      );
      setRecentFiles(filteredFiles);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('Failed to search files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      await deleteFile(file.id);
      setRecentFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleStar = async (file: FileItem) => {
    try {
      const updatedFile = await starFile(file.id);
      setRecentFiles(prev => 
        prev.map(f => f.id === file.id ? updatedFile : f)
      );
    } catch (error) {
      console.error('Error starring file:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar activeItem="recent" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={handleSearch} 
          darkMode={darkMode} 
          toggleDarkMode={() => setDarkMode(!darkMode)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Recent Files</h1>
            
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

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No recent files</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recentFiles.map(file => (
                <FileCard 
                  key={file.id}
                  file={file}
                  selected={false}
                  onSelect={() => {}}
                  onStar={() => handleStar(file)}
                  onRename={() => {}}
                  onShare={() => {}}
                  onDelete={() => handleDelete(file)}
                  onDownload={() => {}}
                  onClick={() => {}}
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
                      Last Accessed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentFiles.map(file => (
                    <tr key={file.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(file.lastAccessed).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                          onClick={() => handleStar(file)}
                        >
                          {file.isStarred ? 'Unstar' : 'Star'}
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDelete(file)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Recent; 