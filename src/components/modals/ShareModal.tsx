import React, { useState } from 'react';
import { X, Link, Copy, Calendar, Lock } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (isPublic: boolean, password?: string, expiry?: Date) => void;
  itemName: string;
  shareLink?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  itemName,
  shareLink
}) => {
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;
  
  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let expiry: Date | undefined = undefined;
    if (expiryDays && !isNaN(Number(expiryDays))) {
      expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(expiryDays));
    }
    
    onShare(isPublic, isPublic ? undefined : password, expiry);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Share "{itemName}"</h2>
          <button 
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {shareLink ? (
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Share this link to give others access:
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-1 flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Link className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <input 
                  type="text" 
                  value={shareLink} 
                  readOnly 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 dark:text-gray-200"
                />
              </div>
              <button 
                className={`p-2 rounded-md ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
                onClick={handleCopyLink}
              >
                {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            <button 
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Sharing options</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                  />
                  <span className="text-sm">Anyone with the link can access</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                  />
                  <span className="text-sm">Password protected</span>
                </label>
              </div>
            </div>
            
            {!isPublic && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                    <input 
                      type="password" 
                      className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!isPublic}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Link expiry (optional)</label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <input 
                    type="number" 
                    className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    placeholder="Expires in days"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave blank for no expiration
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button 
                type="button"
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;