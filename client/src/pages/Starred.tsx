import React, { useState } from 'react';
import { Star, Grid, List } from 'lucide-react';
import { useFiles } from '../context/FileContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import FileCard from '../components/file/FileCard';
import FolderCard from '../components/file/FolderCard';
import { FileItem, Folder } from '../types';

const Starred: React.FC = () => {
  const { files, folders, searchItems } = useFiles();
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-500" />
                Starred
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quick access to your starred files and folders
              </p>
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

          {isSearching ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results for "{searchQuery}"</h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No starred items found</p>
                </div>
              ) : (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.map(item => (
                      'type' in item ? (
                        <FileCard 
                          key={item.id}
                          file={item}
                          viewMode="grid"
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
                          viewMode="grid"
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
                              file={item}
                              viewMode="list"
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
                              viewMode="list"
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
                      </tbody>
                    </table>
                  </div>
                )
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
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {starredFolders.map(folder => (
                  <FolderCard 
                    key={folder.id}
                    folder={folder}
                    viewMode="grid"
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
                    viewMode="grid"
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
                        viewMode="list"
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
                        viewMode="list"
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

export default Starred; 