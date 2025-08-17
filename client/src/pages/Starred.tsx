import React, { useState, useEffect } from 'react';
import { Star, Grid, List } from 'lucide-react';
import { useFiles } from '../context/FileContext';
import MainLayout from '../components/layout/MainLayout';
import FileCard from '../components/file/FileCard';
import FolderCard from '../components/file/FolderCard';
import PreviewModal from '../components/modals/PreviewModal';
import { FileItem, Folder } from '../types';

const Starred: React.FC = () => {
  const { files, folders, searchItems, isLoading, loadStarredFiles } = useFiles();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(FileItem | Folder)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  // Load starred files when component mounts
  useEffect(() => {
    // Load starred files
    loadStarredFiles();
  }, [loadStarredFiles]);

  // Simply use the files from context directly
  const starredFiles = files;
  const starredFolders = folders.filter(folder => folder.starred);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      const results = await searchItems(query);
      // Filter search results to only show starred items
      setSearchResults(results.filter(item => 'starred' in item && item.starred));
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleFileClick = (file: FileItem) => {
    setPreviewFile(file);
  };

  const handleFolderClick = (folder: Folder) => {
    // Handle folder navigation here
    // For now, we'll just log it
    console.log('Folder clicked:', folder);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
              <Star className="w-6 h-6 mr-2 text-yellow-500" />
              Starred
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick access to your starred files and folders
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center text-blue-500">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            )}

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

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search starred items..."
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

        {/* Content */}
        {isSearching ? (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Search Results for "{searchQuery}"
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No starred items found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map(item => (
                  'type' in item ? (
                    <FileCard 
                      key={item.id}
                      file={item as FileItem}
                      viewMode="grid"
                      selected={false}
                      onSelect={() => {}}
                      onStar={() => {}}
                      onRename={() => {}}
                      onShare={() => {}}
                      onDelete={() => {}}
                      onDownload={() => {}}
                      onClick={() => handleFileClick(item as FileItem)}
                    />
                  ) : (
                    <FolderCard 
                      key={item.id}
                      folder={item as Folder}
                      viewMode="grid"
                      selected={false}
                      onSelect={() => {}}
                      onStar={() => {}}
                      onRename={() => {}}
                      onShare={() => {}}
                      onDelete={() => {}}
                      onClick={() => handleFolderClick(item as Folder)}
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
                    {searchResults.map(item => (
                      'type' in item ? (
                        <FileCard 
                          key={item.id}
                          file={item as FileItem}
                          viewMode="list"
                          selected={false}
                          onSelect={() => {}}
                          onStar={() => {}}
                          onRename={() => {}}
                          onShare={() => {}}
                          onDelete={() => {}}
                          onDownload={() => {}}
                          onClick={() => handleFileClick(item as FileItem)}
                        />
                      ) : (
                        <FolderCard 
                          key={item.id}
                          folder={item as Folder}
                          viewMode="list"
                          selected={false}
                          onSelect={() => {}}
                          onStar={() => {}}
                          onRename={() => {}}
                          onShare={() => {}}
                          onDelete={() => {}}
                          onClick={() => handleFolderClick(item as Folder)}
                        />
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : starredFiles.length === 0 && starredFolders.length === 0 ? (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No starred items</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Star your important files and folders to access them quickly.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {starredFolders.map(folder => (
              <FolderCard 
                key={folder.id}
                folder={folder}
                viewMode={viewMode}
                selected={false}
                onSelect={() => {}}
                onStar={() => {}}
                onRename={() => {}}
                onShare={() => {}}
                onDelete={() => {}}
                onClick={() => handleFolderClick(folder)}
              />
            ))}
            
            {starredFiles.map(file => (
              <FileCard 
                key={file.id}
                file={file}
                viewMode={viewMode}
                selected={false}
                onSelect={() => {}}
                onStar={() => {}}
                onRename={() => {}}
                onShare={() => {}}
                onDelete={() => {}}
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
                {starredFolders.map(folder => (
                  <FolderCard 
                    key={folder.id}
                    folder={folder}
                    viewMode={viewMode}
                    selected={false}
                    onSelect={() => {}}
                    onStar={() => {}}
                    onRename={() => {}}
                    onShare={() => {}}
                    onDelete={() => {}}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
                
                {starredFiles.map(file => (
                  <FileCard 
                    key={file.id}
                    file={file}
                    viewMode={viewMode}
                    selected={false}
                    onSelect={() => {}}
                    onStar={() => {}}
                    onRename={() => {}}
                    onShare={() => {}}
                    onDelete={() => {}}
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

export default Starred; 