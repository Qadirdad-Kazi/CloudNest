import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey || false) === event.ctrlKey;
      const shiftMatches = (shortcut.shiftKey || false) === event.shiftKey;
      const altMatches = (shortcut.altKey || false) === event.altKey;
      
      return keyMatches && ctrlMatches && shiftMatches && altMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Predefined shortcuts for CloudNest
export const cloudNestShortcuts = {
  // File operations
  upload: {
    key: 'u',
    ctrlKey: true,
    action: () => console.log('Upload file'),
    description: 'Upload file'
  },
  newFolder: {
    key: 'n',
    ctrlKey: true,
    shiftKey: true,
    action: () => console.log('Create new folder'),
    description: 'Create new folder'
  },
  delete: {
    key: 'Delete',
    action: () => console.log('Delete selected'),
    description: 'Delete selected item'
  },
  rename: {
    key: 'F2',
    action: () => console.log('Rename selected'),
    description: 'Rename selected item'
  },
  
  // Navigation
  dashboard: {
    key: 'd',
    ctrlKey: true,
    action: () => console.log('Go to dashboard'),
    description: 'Go to dashboard'
  },
  starred: {
    key: 's',
    ctrlKey: true,
    action: () => console.log('Go to starred'),
    description: 'Go to starred files'
  },
  recent: {
    key: 'r',
    ctrlKey: true,
    action: () => console.log('Go to recent files'),
    description: 'Go to recent files'
  },
  trash: {
    key: 't',
    ctrlKey: true,
    action: () => console.log('Go to trash'),
    description: 'Go to trash'
  },
  
  // Search
  search: {
    key: '/',
    action: () => console.log('Focus search'),
    description: 'Focus search'
  },
  advancedSearch: {
    key: 'f',
    ctrlKey: true,
    shiftKey: true,
    action: () => console.log('Advanced search'),
    description: 'Advanced search'
  },
  
  // View
  gridView: {
    key: 'g',
    ctrlKey: true,
    action: () => console.log('Grid view'),
    description: 'Grid view'
  },
  listView: {
    key: 'l',
    ctrlKey: true,
    action: () => console.log('List view'),
    description: 'List view'
  },
  refresh: {
    key: 'F5',
    action: () => console.log('Refresh'),
    description: 'Refresh'
  },
  
  // Selection
  selectAll: {
    key: 'a',
    ctrlKey: true,
    action: () => console.log('Select all'),
    description: 'Select all'
  },
  deselectAll: {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    action: () => console.log('Deselect all'),
    description: 'Deselect all'
  },
  
  // Actions
  share: {
    key: 's',
    shiftKey: true,
    action: () => console.log('Share selected'),
    description: 'Share selected item'
  },
  download: {
    key: 'Enter',
    shiftKey: true,
    action: () => console.log('Download selected'),
    description: 'Download selected item'
  },
  copy: {
    key: 'c',
    ctrlKey: true,
    action: () => console.log('Copy selected'),
    description: 'Copy selected item'
  },
  paste: {
    key: 'v',
    ctrlKey: true,
    action: () => console.log('Paste'),
    description: 'Paste'
  },
  
  // Application
  help: {
    key: 'F1',
    action: () => console.log('Show help'),
    description: 'Show help'
  },
  settings: {
    key: ',',
    ctrlKey: true,
    action: () => console.log('Open settings'),
    description: 'Open settings'
  },
  logout: {
    key: 'l',
    ctrlKey: true,
    shiftKey: true,
    action: () => console.log('Logout'),
    description: 'Logout'
  },
  
  // Modal/Dialog
  close: {
    key: 'Escape',
    action: () => console.log('Close modal'),
    description: 'Close modal/dialog'
  },
  confirm: {
    key: 'Enter',
    action: () => console.log('Confirm action'),
    description: 'Confirm action'
  },
  
  // Quick access
  uploadFiles: {
    key: 'o',
    ctrlKey: true,
    action: () => console.log('Open file upload'),
    description: 'Open file upload'
  },
  createFolder: {
    key: 'f',
    ctrlKey: true,
    action: () => console.log('Create folder'),
    description: 'Create folder'
  }
};

// Helper function to format shortcut display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  parts.push(shortcut.key);
  
  return parts.join(' + ');
};

// Hook for getting all available shortcuts
export const useAvailableShortcuts = () => {
  return Object.entries(cloudNestShortcuts).map(([key, shortcut]) => ({
    key,
    ...shortcut,
    formatted: formatShortcut(shortcut)
  }));
};
