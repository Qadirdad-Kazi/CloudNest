import React from 'react';
import { Loader2, File, Folder, Star, Clock, Share2, Trash2 } from 'lucide-react';

interface LoadingOptimizerProps {
  isLoading: boolean;
  type: 'files' | 'starred' | 'shared' | 'recent' | 'trash';
  error?: string | null;
  children: React.ReactNode;
}

// Skeleton components for better loading experience
const FileSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const GridSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm animate-pulse">
        <div className="w-full h-24 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC<{ type: string }> = ({ type }) => {
  const getEmptyStateConfig = (type: string) => {
    switch (type) {
      case 'starred':
        return {
          icon: Star,
          title: 'No starred items',
          description: 'Star your important files and folders to access them quickly.',
          color: 'text-yellow-500'
        };
      case 'shared':
        return {
          icon: Share2,
          title: 'No shared items',
          description: 'Files and folders shared with you will appear here.',
          color: 'text-blue-500'
        };
      case 'recent':
        return {
          icon: Clock,
          title: 'No recent files',
          description: 'Recently accessed files will appear here.',
          color: 'text-green-500'
        };
      case 'trash':
        return {
          icon: Trash2,
          title: 'Trash is empty',
          description: 'Deleted files and folders will appear here.',
          color: 'text-red-500'
        };
      default:
        return {
          icon: File,
          title: 'No files found',
          description: 'Upload files or create folders to get started.',
          color: 'text-gray-500'
        };
    }
  };

  const config = getEmptyStateConfig(type);
  const IconComponent = config.icon;

  return (
    <div className="text-center py-12">
      <IconComponent className={`mx-auto h-12 w-12 ${config.color}`} />
      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
        {config.title}
      </h3>
      <p className="mt-1 text-gray-500 dark:text-gray-400">
        {config.description}
      </p>
    </div>
  );
};

const ErrorState: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-12 w-12 text-red-500 mb-4">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Something went wrong
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4">
      {error}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Loader2 className="w-4 h-4 mr-2" />
        Try Again
      </button>
    )}
  </div>
);

const LoadingOptimizer: React.FC<LoadingOptimizerProps> = ({ 
  isLoading, 
  type, 
  error, 
  children 
}) => {
  if (error) {
    return <ErrorState error={error} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading {type}...
          </span>
        </div>
        <GridSkeleton />
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingOptimizer;
