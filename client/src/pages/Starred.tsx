import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useFiles } from '../context/FileContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FileCard from '../components/file/FileCard';
import FolderCard from '../components/file/FolderCard';

const Starred: React.FC = () => {
  const { files, folders, searchItems } = useFiles();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(FileItem | Folder)[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter starred items
  const starredFiles = files.filter(file => file.starred);
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar activeItem="starred" onItemClick={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={handleSearch} 
          darkMode={darkMode} 
          toggleDarkMode={() => setDarkMode(!darkMode)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-500" />
              Starred
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick access to your starred files and folders
            </p>
          </div>

          {isSearching ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results for "{searchQuery}"</h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No starred items found</p>
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
          ) : starredFiles.length === 0 && starredFolders.length === 0 ? (
            <div className="text-center py-12">
              <Star className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No starred items</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Star your important files and folders to access them quickly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {starredFolders.map(folder => (
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
              
              {starredFiles.map(file => (
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
        </main>
      </div>
    </div>
  );
};

export default Starred; 