import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Eye, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (type.startsWith('video/')) return <Film className="w-6 h-6" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  const isPreviewable = (type: string) => {
    return type.startsWith('image/') || 
           type.startsWith('video/') || 
           type.startsWith('audio/') ||
           type === 'application/pdf' ||
           type.includes('text/');
  };

  const renderPreview = () => {
    if (!isPreviewable(file.type)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          {getFileIcon(file.type)}
          <p className="mt-4 text-lg">Preview not available</p>
          <p className="text-sm mt-2">Download to view this file</p>
        </div>
      );
    }

    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load image')}
        />
      );
    }

    if (file.type.startsWith('video/')) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-full max-h-full"
          onLoadStart={() => setLoading(false)}
          onError={() => setError('Failed to load video')}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (file.type.startsWith('audio/')) {
      return (
        <audio
          src={file.url}
          controls
          className="w-full"
          onLoadStart={() => setLoading(false)}
          onError={() => setError('Failed to load audio')}
        >
          Your browser does not support the audio tag.
        </audio>
      );
    }

    if (file.type === 'application/pdf') {
      return (
        <iframe
          src={file.url}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load PDF')}
          title={file.name}
        />
      );
    }

    if (file.type.includes('text/')) {
      return (
        <iframe
          src={file.url}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load text file')}
          title={file.name}
        />
      );
    }

    return null;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `Check out this file: ${file.name}`,
          url: file.url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(file.url);
      alert('Link copied to clipboard!');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <Eye className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Preview Error</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="flex items-center justify-center h-full p-4">
              {renderPreview()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {isPreviewable(file.type) ? 'Preview available' : 'Preview not available'}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
