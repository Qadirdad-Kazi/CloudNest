import React from 'react';
import { 
  Folder, 
  MoreVertical, 
  Star, 
  Share2, 
  Trash2, 
  Edit 
} from 'lucide-react';
import type { Folder as FolderType } from '../../types';

interface FolderCardProps {
  folder: FolderType;
  selected: boolean;
  viewMode?: 'grid' | 'list';
  onSelect: (folder: FolderType) => void;
  onStar: (folder: FolderType) => void;
  onRename: (folder: FolderType) => void;
  onShare: (folder: FolderType) => void;
  onDelete: (folder: FolderType) => void;
  onClick: (folder: FolderType) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  selected,
  viewMode = 'grid',
  onSelect,
  onStar,
  onRename,
  onShare,
  onDelete,
  onClick
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  
  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(folder);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(folder);
  };

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStar(folder);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare(folder);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRename(folder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(folder);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Render list view
  if (viewMode === 'list') {
    return (
      <tr 
        className={`
          group cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50
          ${selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
        `}
        onClick={handleClick}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Folder className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {folder.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Folder
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(folder.modifiedAt)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            --
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleStar}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Star className={`w-5 h-5 ${folder.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={handleMenuToggle}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={handleRename}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </td>
      </tr>
    );
  }

  // Render grid view
  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all duration-200
        hover:shadow-lg group cursor-pointer
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-700'}
      `}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <div 
          className={`
            w-5 h-5 rounded-md border shadow-sm flex items-center justify-center
            ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
            opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer
          `}
          onClick={handleSelect}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Star button */}
      <div 
        className={`absolute top-2 right-10 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        onClick={handleStar}
      >
        <Star 
          className={`w-5 h-5 ${
            folder.starred 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-500'
          }`} 
        />
      </div>

      {/* Folder icon */}
      <div className="relative w-full pt-[100%] rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors duration-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <Folder className="w-16 h-16 text-indigo-500 dark:text-indigo-400" />
        </div>
      </div>

      {/* Folder info */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {folder.name}
        </h3>
        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span>Folder</span>
          <span className="mx-1">•</span>
          <span>{formatDate(folder.modifiedAt)}</span>
        </div>

        {/* Tags/badges */}
        {(folder.shared || folder.starred) && (
          <div className="flex mt-2 space-x-2">
            {folder.shared && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Share2 className="w-3 h-3 mr-1" />
                Shared
              </span>
            )}
            {folder.starred && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Starred
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div className="absolute top-2 right-2 flex space-x-1">
        <div className="relative">
          <button 
            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={handleMenuToggle}
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48">
              <div className="flex flex-col space-y-2">
                <button 
                  key={`star-${folder.id}`} 
                  onClick={handleStar} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                >
                  <Star className={`w-4 h-4 ${folder.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{folder.starred ? 'Unstar' : 'Star'}</span>
                </button>
                <button 
                  key={`rename-${folder.id}`} 
                  onClick={handleRename} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Rename</span>
                </button>
                <button 
                  key={`share-${folder.id}`} 
                  onClick={handleShare} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>Share</span>
                </button>
                <button 
                  key={`delete-${folder.id}`} 
                  onClick={handleDelete} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderCard;