import React, { useState, useEffect } from 'react';
import { Grid, List, Trash2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FileCard from '../components/file/FileCard';
import { useFiles } from '../context/FileContext';
import { FileItem } from '../types';
// import { fileService } from '../services/fileService';

const Trash: React.FC = () => {
  const { deleteFile } = useFiles();
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
      // Use mock data for now since the API might not be fully implemented
      // const files = await fileService.getTrashFiles();
      const files: FileItem[] = [
        {
          id: '3',
          name: 'Deleted Document.pdf',
          type: 'pdf',
          size: 1024 * 1024 * 1.5, // 1.5MB
          path: '/Deleted Document.pdf',
          owner: 'user123',
          shared: false,
          starred: false,
          tags: ['work'],
          createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
          modifiedAt: new Date(Date.now() - 864000000).toISOString() // 10 days ago
        },
        {
          id: '4',
          name: 'Old Image.jpg',
          type: 'jpg',
          size: 1024 * 768, // 768KB
          path: '/Old Image.jpg',
          owner: 'user123',
          shared: false,
          starred: false,
          tags: [],
          createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
          modifiedAt: new Date(Date.now() - 1728000000).toISOString() // 20 days ago
        }
      ];
      setTrashedFiles(files);
    } catch (error) {
      console.error('Error loading trashed files:', error);
      setError('Failed to load trashed files');
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
      // Use mock data for now since the API might not be fully implemented
      // const files = await fileService.getTrashFiles();
      const files: FileItem[] = [
        {
          id: '3',
          name: 'Deleted Document.pdf',
          type: 'pdf',
          size: 1024 * 1024 * 1.5, // 1.5MB
          path: '/Deleted Document.pdf',
          owner: 'user123',
          shared: false,
          starred: false,
          tags: ['work'],
          createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
          modifiedAt: new Date(Date.now() - 864000000).toISOString() // 10 days ago
        },
        {
          id: '4',
          name: 'Old Image.jpg',
          type: 'jpg',
          size: 1024 * 768, // 768KB
          path: '/Old Image.jpg',
          owner: 'user123',
          shared: false,
          starred: false,
          tags: [],
          createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
          modifiedAt: new Date(Date.now() - 1728000000).toISOString() // 20 days ago
        }
      ];
      const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase())
      );
      setTrashedFiles(filteredFiles);
    } catch (error) {
      console.error('Error searching files:', error);
      setError('Failed to search files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (file: FileItem) => {
    try {
      // Mock restore functionality since fileService is commented out
      // await fileService.restoreFromTrash(file.id);
      setTrashedFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Error restoring file:', error);
    }
  };

  const handleDelete = async (file: FileItem) => {
    try {
      await deleteFile(file.id, true); // skipTrash = true for permanent deletion
      setTrashedFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      // Mock empty trash functionality since fileService is commented out
      // await fileService.emptyTrash();
      setTrashedFiles([]);
    } catch (error) {
      console.error('Error emptying trash:', error);
    }
  };

  const [activeSection, setActiveSection] = useState("trash");

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar activeItem={activeSection} onItemClick={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={handleSearch} 
          darkMode={darkMode} 
          toggleDarkMode={() => setDarkMode(!darkMode)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Trash</h1>
            
            <div className="flex items-center space-x-4">
              {trashedFiles.length > 0 && (
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                  onClick={handleEmptyTrash}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Empty Trash
                </button>
              )}
              
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

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : trashedFiles.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Trash is empty</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Files you delete will appear here for 30 days before being permanently deleted.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
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
                  onRestore={() => handleRestore(file)}
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
                      Deleted At
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
                  {trashedFiles.map(file => (
                    <tr key={file.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(file.modifiedAt).toLocaleDateString()}
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
                          onClick={() => handleRestore(file)}
                        >
                          Restore
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDelete(file)}
                        >
                          Delete Permanently
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

export default Trash; 