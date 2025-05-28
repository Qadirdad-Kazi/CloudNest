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
  Edit
} from 'lucide-react';
import { FileItem } from '../../types';

interface FileCardProps {
  file: FileItem;
  selected: boolean;
  onSelect: (file: FileItem) => void;
  onStar: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onClick: (file: FileItem) => void;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  selected,
  onSelect,
  onStar,
  onRename,
  onShare,
  onDelete,
  onDownload,
  onClick
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  
  // Get the file icon based on type
  const getFileIcon = () => {
    switch (file.type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-8 h-8 text-green-500" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      case 'js':
      case 'ts':
      case 'html':
      case 'css':
        return <FileCode className="w-8 h-8 text-blue-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
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
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(file);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(file);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg border p-3 cursor-pointer transition-all 
        hover:shadow-md group
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-700'}
      `}
      onClick={handleClick}
    >
      <div className="absolute top-2 right-2 flex space-x-1">
        <div 
          className={`
            w-5 h-5 rounded-md border flex items-center justify-center
            ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}
            group-hover:opacity-100 transition-opacity cursor-pointer
          `}
          onClick={handleSelect}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        
        <div className="relative">
          <button 
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleMenuToggle}
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => handleMenuAction(e, () => onStar(file))}
              >
                <Star className={`w-4 h-4 mr-2 ${file.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500 dark:text-gray-400'}`} />
                {file.starred ? 'Unstar' : 'Star'}
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => handleMenuAction(e, () => onShare(file))}
              >
                <Share2 className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                Share
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => handleMenuAction(e, () => onDownload(file))}
              >
                <Download className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                Download
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={(e) => handleMenuAction(e, () => onRename(file))}
              >
                <Edit className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                Rename
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600"
                onClick={(e) => handleMenuAction(e, () => onDelete(file))}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        {getFileIcon()}
        <h3 className="mt-2 text-sm font-medium text-center truncate w-full">{file.name}</h3>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)} • {formatDate(file.modifiedAt)}
        </div>
      </div>
      
      {(file.shared || file.starred) && (
        <div className="flex justify-center mt-2 space-x-2">
          {file.shared && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Share2 className="w-3 h-3 mr-1" />
              Shared
            </span>
          )}
          {file.starred && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Starred
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FileCard;