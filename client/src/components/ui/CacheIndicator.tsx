import React, { useEffect, useState } from 'react';
import { Database, Zap, RefreshCw } from 'lucide-react';

interface CacheIndicatorProps {
  show: boolean;
  type: 'hit' | 'miss' | 'clear';
  path?: string;
}

const CacheIndicator: React.FC<CacheIndicatorProps> = ({ show, type, path }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000); // Show for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'hit':
        return {
          icon: <Zap className="w-4 h-4" />,
          bg: 'bg-green-500',
          text: 'Cache Hit',
          description: 'Loaded from cache'
        };
      case 'miss':
        return {
          icon: <Database className="w-4 h-4" />,
          bg: 'bg-blue-500',
          text: 'Cache Miss',
          description: 'Loading from server'
        };
      case 'clear':
        return {
          icon: <RefreshCw className="w-4 h-4" />,
          bg: 'bg-orange-500',
          text: 'Cache Cleared',
          description: 'Fresh data loading'
        };
    }
  };

  const config = getConfig();

  return (
    <div 
      className="fixed top-20 right-6 z-50 animate-slide-down"
      role="status"
      aria-live="polite"
    >
      <div className={`${config.bg} text-white rounded-lg shadow-lg p-3 flex items-center space-x-3 min-w-[200px]`}>
        <div className="flex-shrink-0 animate-pulse">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{config.text}</p>
          <p className="text-xs opacity-90">{config.description}</p>
          {path && <p className="text-xs opacity-75 truncate mt-1">{path}</p>}
        </div>
      </div>
    </div>
  );
};

export default CacheIndicator;

