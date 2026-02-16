import React from 'react';
import { X } from 'lucide-react';
import { FileItem } from '../../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;

  const isImage = file.type.toLowerCase().match(/^image\/(jpeg|jpg|png|gif|webp)$/);
  const isPDF = file.type.toLowerCase() === 'application/pdf';
  const isText = file.type.toLowerCase().match(/^text\/(plain|html|css|javascript|typescript)$/);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {file.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {isImage && file.url && (
              <div className="flex items-center justify-center">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}

            {isPDF && file.url && (
              <iframe
                src={file.url}
                title={file.name}
                className="w-full h-[70vh] border-0"
              />
            )}

            {isText && file.url && (
              <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[70vh]">
                {/* Text content would be loaded here */}
              </pre>
            )}

            {!isImage && !isPDF && !isText && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Preview not available for this file type. Please download to view.
                </p>
                {file.url && (
                  <a
                    href={file.url}
                    download={file.name}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Download File
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 