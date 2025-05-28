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
  const getFileIcon = () => {
    // If it's an image with a Cloudinary URL, show the actual image thumbnail
    if (file.cloudinaryUrl && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.type.toLowerCase())) {
      return (
        <div className="relative w-10 h-10 overflow-hidden rounded-md">
          <img 
            src={file.cloudinaryUrl} 
            alt={file.name} 
            className="object-cover w-full h-full" 
          />
        </div>
      );
    }
    
    // If it's a document stored in MongoDB, show a document icon with a lock symbol
    if (file.mongodbId && ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.type.toLowerCase())) {
      return (
        <div className="relative">
          <FileText className="w-8 h-8 text-red-500" />
          <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-600 bg-white rounded-full" />
        </div>
      );
    }
    
    // Otherwise use the default icon system
    switch (file.type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // If it's a MongoDB document, fetch it from MongoDB
      if (file.mongodbId) {
        const documentBlob = await mongodbService.getDocument(file.mongodbId);
        const url = URL.createObjectURL(documentBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      // If it's a Cloudinary image, download it from Cloudinary
      else if (file.cloudinaryUrl) {
        const a = document.createElement('a');
        a.href = file.cloudinaryUrl;
        a.download = file.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      // Otherwise use the default download handler
      else {
        onDownload(file);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to the default download handler
      onDownload(file);
    }
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
            <div className="absolute right-0 top-6 z-10 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2">
              <div className="flex flex-col space-y-2">
                {!isInTrash && (
                  <>
                    <button onClick={() => { setShowMenu(false); onStar(file); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                      <Star className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setShowMenu(false); onRename(file); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setShowMenu(false); onShare(file); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { setShowMenu(false); handleDownload(e); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setShowMenu(false); onDelete(file); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {isInTrash && (
                  <>
                    <button 
                      onClick={() => { 
                        setShowMenu(false); 
                        if (onRestore) onRestore(file); 
                      }} 
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
                      onClick={() => { 
                        setShowMenu(false); 
                        onDelete(file); 
                      }} 
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
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div className="flex-1 truncate">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)} • {formatDate(file.modifiedAt)}
            </p>
          </div>
        </div>
        
        {file.starred && (
          <div className="absolute top-2 left-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileCard;