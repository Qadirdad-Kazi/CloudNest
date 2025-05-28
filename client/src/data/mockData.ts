import { User, FileItem, Folder, ActivityLog, ShareLink } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@cloudrive.com',
    role: 'admin',
    storageUsed: 1024 * 1024 * 125, // 125MB
    storageLimit: 1024 * 1024 * 1024 * 10, // 10GB
    createdAt: '2023-01-01T10:00:00Z',
    lastLogin: '2023-04-01T08:30:00Z',
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@cloudrive.com',
    role: 'user',
    storageUsed: 1024 * 1024 * 350, // 350MB
    storageLimit: 1024 * 1024 * 1024 * 5, // 5GB
    createdAt: '2023-01-15T14:00:00Z',
    lastLogin: '2023-04-01T09:45:00Z',
  },
  {
    id: '3',
    name: 'Guest User',
    email: 'guest@cloudrive.com',
    role: 'guest',
    storageUsed: 1024 * 1024 * 10, // 10MB
    storageLimit: 1024 * 1024 * 100, // 100MB
    createdAt: '2023-02-10T11:30:00Z',
    lastLogin: '2023-03-25T16:20:00Z',
  },
];

export const mockFolders: Folder[] = [
  {
    id: 'folder-1',
    name: 'Documents',
    path: '/Documents',
    owner: '2',
    shared: false,
    starred: true,
    tags: ['work', 'important'],
    createdAt: '2023-02-01T10:00:00Z',
    modifiedAt: '2023-03-15T14:30:00Z',
  },
  {
    id: 'folder-2',
    name: 'Photos',
    path: '/Photos',
    owner: '2',
    shared: true,
    starred: false,
    tags: ['personal', 'memories'],
    createdAt: '2023-02-05T09:00:00Z',
    modifiedAt: '2023-03-20T11:15:00Z',
  },
  {
    id: 'folder-3',
    name: 'Projects',
    path: '/Projects',
    owner: '2',
    shared: false,
    starred: false,
    tags: ['work'],
    createdAt: '2023-02-10T15:00:00Z',
    modifiedAt: '2023-03-18T16:45:00Z',
  },
];

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'Quarterly Report.pdf',
    type: 'pdf',
    size: 1024 * 1024 * 2.5, // 2.5MB
    owner: '2',
    path: '/Documents',
    shared: true,
    starred: true,
    tags: ['work', 'report', 'q1'],
    createdAt: '2023-03-01T09:30:00Z',
    modifiedAt: '2023-03-01T09:30:00Z',
    thumbnail: 'https://via.placeholder.com/40',
  },
  {
    id: 'file-2',
    name: 'Vacation Photo.jpg',
    type: 'jpg',
    size: 1024 * 1024 * 4.2, // 4.2MB
    owner: '2',
    path: '/Photos',
    shared: false,
    starred: true,
    tags: ['vacation', 'beach'],
    createdAt: '2023-03-10T14:45:00Z',
    modifiedAt: '2023-03-10T14:45:00Z',
    thumbnail: 'https://via.placeholder.com/40',
  },
  {
    id: 'file-3',
    name: 'Project Proposal.docx',
    type: 'docx',
    size: 1024 * 1024 * 1.8, // 1.8MB
    owner: '2',
    path: '/Projects',
    shared: true,
    starred: false,
    tags: ['work', 'proposal'],
    createdAt: '2023-03-15T11:20:00Z',
    modifiedAt: '2023-03-18T10:15:00Z',
    thumbnail: 'https://via.placeholder.com/40',
  },
  {
    id: 'file-4',
    name: 'Budget Spreadsheet.xlsx',
    type: 'xlsx',
    size: 1024 * 1024 * 3.1, // 3.1MB
    owner: '2',
    path: '/Documents',
    shared: false,
    starred: false,
    tags: ['finance', 'budget'],
    createdAt: '2023-03-05T16:30:00Z',
    modifiedAt: '2023-03-12T09:45:00Z',
    thumbnail: 'https://via.placeholder.com/40',
  },
  {
    id: 'file-5',
    name: 'Meeting Notes.txt',
    type: 'txt',
    size: 1024 * 15, // 15KB
    owner: '2',
    path: '/Documents',
    shared: false,
    starred: false,
    tags: ['work', 'meetings'],
    createdAt: '2023-03-20T10:00:00Z',
    modifiedAt: '2023-03-20T10:00:00Z',
    thumbnail: 'https://via.placeholder.com/40',
  },
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    userId: '2',
    action: 'upload',
    itemId: 'file-1',
    itemName: 'Quarterly Report.pdf',
    timestamp: '2023-03-01T09:30:00Z',
    details: 'File uploaded to /Documents',
  },
  {
    id: 'log-2',
    userId: '2',
    action: 'share',
    itemId: 'file-1',
    itemName: 'Quarterly Report.pdf',
    timestamp: '2023-03-01T09:35:00Z',
    details: 'File shared with admin@cloudrive.com',
  },
  {
    id: 'log-3',
    userId: '2',
    action: 'upload',
    itemId: 'file-2',
    itemName: 'Vacation Photo.jpg',
    timestamp: '2023-03-10T14:45:00Z',
    details: 'File uploaded to /Photos',
  },
  {
    id: 'log-4',
    userId: '2',
    action: 'rename',
    itemId: 'file-3',
    itemName: 'Project Proposal.docx',
    timestamp: '2023-03-18T10:15:00Z',
    details: 'File renamed from "Draft Proposal.docx"',
  },
  {
    id: 'log-5',
    userId: '1',
    action: 'login',
    timestamp: '2023-04-01T08:30:00Z',
  },
  {
    id: 'log-6',
    userId: '2',
    action: 'login',
    timestamp: '2023-04-01T09:45:00Z',
  },
];

export const mockShareLinks: ShareLink[] = [
  {
    id: 'share-1',
    fileId: 'file-1',
    url: 'https://cloudrive.com/s/a1b2c3d4',
    isPublic: true,
    createdAt: '2023-03-01T09:35:00Z',
  },
  {
    id: 'share-2',
    fileId: 'file-3',
    url: 'https://cloudrive.com/s/e5f6g7h8',
    isPublic: false,
    password: '1234',
    expiresAt: '2023-05-01T00:00:00Z',
    createdAt: '2023-03-15T11:25:00Z',
  },
];

export const getCurrentUser = (): User => {
  return mockUsers[1]; // Return the regular user by default
};