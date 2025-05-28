import React from 'react';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
  color = 'bg-indigo-600',
  className = '',
}) => {
  return (
    <div 
      className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className={`${color} transition-all duration-300 ease-in-out`}
        style={{ 
          width: `${progress}%`,
          height: '100%',
        }}
      />
    </div>
  );
};

export default ProgressBar;
