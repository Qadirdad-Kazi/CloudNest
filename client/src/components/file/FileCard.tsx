import React from 'react';
import { 
  FileText, 
  Image, 
  FileSpreadsheet, 
  FileCode, 
  File, 
  MoreVertical,
  Star,
  Share2,
  Download,
  Trash2,
  Edit,
  Lock
} from 'lucide-react';
import { FileItem } from '../../types';
import { mongodbService } from '../../services/mongodbService';

interface FileCardProps {
  file: FileItem;
  selected: boolean;
  viewMode?: 'grid' | 'list';
  onSelect: (file: FileItem) => void;
  onStar: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onClick: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  isInTrash?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  selected,
  viewMode = 'grid',
  onSelect,
  onStar,
  onRename,
  onShare,
  onDelete,
  onDownload,
  onClick,
  onRestore,
  isInTrash = false
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  
  // Get the file icon or thumbnail based on type
  const getFileIcon = (size: 'small' | 'large' = 'large') => {
    // If it's an image from Cloudinary, show the actual image thumbnail
    if (file.cloudProvider === 'cloudinary' && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.type.toLowerCase())) {
      return (
        <div className={`relative ${size === 'large' ? 'w-full pt-[100%]' : 'w-10 h-10'} overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700`}>
          <img 
            src={file.url} 
            alt={file.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      );
    }
    
    // If it's a document stored in MongoDB, show a document icon with a lock symbol
    if (file.cloudProvider === 'mongodb' && ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.type.toLowerCase())) {
      return (
        <div className={`relative ${size === 'large' ? 'w-full pt-[100%]' : 'w-10 h-10'} rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center overflow-hidden group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors duration-200`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <FileText className={`${size === 'large' ? 'w-16 h-16' : 'w-6 h-6'} text-red-500`} />
              <Lock className={`absolute -bottom-1 -right-1 ${size === 'large' ? 'w-6 h-6' : 'w-3 h-3'} text-blue-600 bg-white dark:bg-gray-800 rounded-full shadow-sm`} />
            </div>
          </div>
        </div>
      );
    }
    
    // Otherwise use the default icon system with a background
    const getIconConfig = () => {
      switch (file.type.toLowerCase()) {
        case 'pdf':
          return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' };
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
          return { icon: Image, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' };
        case 'xlsx':
        case 'csv':
          return { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' };
        case 'js':
        case 'ts':
        case 'html':
        case 'css':
          return { icon: FileCode, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
        default:
          return { icon: File, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-600/30' };
      }
    };

    const { icon: Icon, color, bg } = getIconConfig();
    return (
      <div className={`relative ${size === 'large' ? 'w-full pt-[100%]' : 'w-10 h-10'} rounded-lg ${bg} flex items-center justify-center overflow-hidden group-hover:bg-opacity-75 transition-colors duration-200`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`${size === 'large' ? 'w-16 h-16' : 'w-6 h-6'} ${color}`} />
        </div>
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(file);
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRestore) {
      onRestore(file);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDownload) {
      onDownload(file);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShare) {
      onShare(file);
    }
  };

  const handleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStar) {
      onStar(file);
    }
  };

  const handleRename = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRename) {
      onRename(file);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(file);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(file);
    }
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
              {getFileIcon('small')}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {file.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {file.type.toUpperCase()}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(file.updatedAt)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleStar}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Star className={`w-5 h-5 ${file.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
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
                {!isInTrash ? (
                  <>
                    <button
                      onClick={handleRename}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Rename
                    </button>
                    <button
                      onClick={handleDownload}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRestore}
                      className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Restore
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Delete Permanently
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </td>
      </tr>
    );
  }

  // Render grid view (existing code)
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
            file.starred 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-500'
          }`} 
        />
      </div>

      {/* File thumbnail/icon */}
      {getFileIcon('large')}

      {/* File info */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {file.name}
        </h3>
        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{formatDate(file.updatedAt)}</span>
        </div>

        {/* Tags/badges */}
        {(file.shared || file.starred) && (
          <div className="flex mt-2 space-x-2">
            {file.shared && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Share2 className="w-3 h-3 mr-1" />
                Shared
              </span>
            )}
            {file.starred && (
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
                {!isInTrash && (
                  <>
                    <button 
                      key={`star-${file.id}`} 
                      onClick={handleStar} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                    >
                      <Star className={`w-4 h-4 ${file.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 dark:text-gray-400'}`} />
                      <span>{file.starred ? 'Unstar' : 'Star'}</span>
                    </button>
                    <button 
                      key={`rename-${file.id}`} 
                      onClick={handleRename} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>Rename</span>
                    </button>
                    <button 
                      key={`share-${file.id}`} 
                      onClick={handleShare} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>Share</span>
                    </button>
                    <button 
                      key={`download-${file.id}`} 
                      onClick={handleDownload} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>Download</span>
                    </button>
                    <button 
                      key={`delete-${file.id}`} 
                      onClick={handleDelete} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
                
                {isInTrash && (
                  <>
                    <button 
                      key={`restore-${file.id}`}
                      onClick={handleRestore}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-green-500"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 7v6h6" />
                          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                        <span className="ml-1 text-xs">Restore</span>
                      </span>
                    </button>
                    <button 
                      key={`delete-${file.id}`}
                      onClick={handleDelete} 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-red-500"
                    >
                      <span className="flex items-center">
                        <Trash2 className="w-4 h-4" />
                        <span className="ml-1 text-xs">Delete</span>
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;