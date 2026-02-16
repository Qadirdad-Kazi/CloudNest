import React from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  onClose?: () => void;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ 
  fileName, 
  progress, 
  status, 
  onClose 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getStatusText()}
              </p>
            </div>
          </div>
          {onClose && (status === 'success' || status === 'error') && (
            <button
              onClick={onClose}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <ProgressBar 
            progress={progress} 
            height={6}
            color={getProgressBarColor()}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {status === 'uploading' ? `${Math.round(progress)}%` : '100%'}
            </span>
            {status === 'uploading' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {progress < 30 ? 'Starting...' : progress < 70 ? 'Uploading...' : 'Almost done...'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;

