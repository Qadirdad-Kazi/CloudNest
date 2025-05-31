export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  starred: boolean;
  inTrash: boolean;
  cloudProvider: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  mongodbId?: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  starred: boolean;
}

export interface ShareLink {
  id: string;
  fileId: string;
  url: string;
  isPublic: boolean;
  createdAt: string;
  expiresAt?: string;
  password?: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
} 