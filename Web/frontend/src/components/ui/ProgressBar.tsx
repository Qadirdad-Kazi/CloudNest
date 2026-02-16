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
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div 
      className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className={`${color} transition-all duration-300 ease-in-out`}
        style={{ 
          width: `${clampedProgress}%`,
          height: '100%',
        }}
      />
    </div>
  );
};

export default ProgressBar;
