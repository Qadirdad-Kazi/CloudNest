export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  storageUsed: number;
  storageLimit: number;
  createdAt: string;
  lastLogin: string;
}

export interface FileItem {
  id?: string;
  _id?: string;
  name: string;
  type: string;
  size: number;
  path: string;
  parentPath: string;
  category: string;
  cloudProvider: 'cloudinary' | 'mongodb';
  cloudId: string;
  url: string;
  starred: boolean;
  modifiedAt: string;
  createdAt: string;
  lastAccessed: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  owner: string;
  shared: boolean;
  starred: boolean;
  inTrash?: boolean; // Whether the folder is in trash
  tags: string[];
  createdAt: string;
  modifiedAt: string;
}

export interface ShareLink {
  id: string;
  fileId: string;
  url: string;
  isPublic: boolean;
  password?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'upload' | 'download' | 'delete' | 'rename' | 'share' | 'login' | 'logout';
  itemId?: string;
  itemName?: string;
  timestamp: string;
  details?: string;
}

export interface StorageStats {
  totalStorage: number;
  usedStorage: number;
  fileCount: number;
  folderCount: number;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}