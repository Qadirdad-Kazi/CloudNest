import React, { useState, useEffect } from 'react';
import { Grid, List } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FileCard from '../components/file/FileCard';
import PreviewModal from '../components/modals/PreviewModal';
import { useFiles } from '../context/FileContext';
import { useTheme } from '../context/ThemeContext';
import { FileItem } from '../types';
import { fileService } from '../services/fileService';

const Recent: React.FC = () => {
  const { deleteFile, starFile } = useFiles();
  const { darkMode, toggleDarkMode } = useTheme();
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

  const [activeSection, setActiveSection] = useState("recent");

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium">No recent files yet</h3>
                <p className="mt-1 text-sm">Upload a file to see it here.</p>
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
        </main>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};

export default Recent; 