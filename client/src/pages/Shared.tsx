import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useFiles } from '../context/FileContext';
import MainLayout from '../components/layout/MainLayout';
import FileCard from '../components/file/FileCard';
import FolderCard from '../components/file/FolderCard';
import { FileItem, Folder } from '../types';

const Shared: React.FC = () => {
  const { files, folders, searchItems } = useFiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(FileItem | Folder)[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter shared items
  const sharedFiles = files.filter(file => file.shared);
  const sharedFolders = folders.filter(folder => folder.shared);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      const results = await searchItems(query);
      // Filter search results to only show shared items
      setSearchResults(results.filter(item => 'shared' in item && item.shared));
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
            <Share2 className="w-6 h-6 mr-2 text-blue-500" />
            Shared
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Files and folders shared with you
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search shared items..."
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
                <p className="text-gray-500 dark:text-gray-400">No shared items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map(item => (
                  'type' in item ? (
                    <FileCard 
                      key={item.id}
                      file={item}
                      selected={false}
                      onSelect={() => {}}
                      onStar={() => {}}
                      onRename={() => {}}
                      onShare={() => {}}
                      onDelete={() => {}}
                      onDownload={() => {}}
                      onClick={() => {}}
                    />
                  ) : (
                    <FolderCard 
                      key={item.id}
                      folder={item}
                      selected={false}
                      onSelect={() => {}}
                      onStar={() => {}}
                      onRename={() => {}}
                      onShare={() => {}}
                      onDelete={() => {}}
                      onClick={() => {}}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        ) : sharedFiles.length === 0 && sharedFolders.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No shared items</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Files and folders shared with you will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sharedFolders.map(folder => (
              <FolderCard 
                key={folder.id}
                folder={folder}
                selected={false}
                onSelect={() => {}}
                onStar={() => {}}
                onRename={() => {}}
                onShare={() => {}}
                onDelete={() => {}}
                onClick={() => {}}
              />
            ))}
            
            {sharedFiles.map(file => (
              <FileCard 
                key={file.id}
                file={file}
                selected={false}
                onSelect={() => {}}
                onStar={() => {}}
                onRename={() => {}}
                onShare={() => {}}
                onDelete={() => {}}
                onDownload={() => {}}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Shared; 