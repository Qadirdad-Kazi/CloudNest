import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Search,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Mail,
  Shield,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin: string | null;
  storageUsed: number;
  storageLimit: number;
  isActive: boolean;
}

interface UserDialogData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  storageLimit: number;
  isActive: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDialogData | null>(null);
  const [editFormData, setEditFormData] = useState<UserDialogData | null>(null);
  
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search, sortBy, sortOrder]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.ADMIN.USERS, {
        params: {
          page: page + 1, // API is 1-indexed
          limit: rowsPerPage,
          search,
          sortBy,
          sortOrder
        }
      });
      
      setUsers(response.data.users);
      setTotalUsers(response.data.pagination.total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };
  
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  const handleOpenEditDialog = (user: User) => {
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storageLimit: user.storageLimit,
      isActive: user.isActive
    };
    setSelectedUser(userData);
    setEditFormData(userData);
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setEditFormData(null);
  };
  
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storageLimit: user.storageLimit,
      isActive: user.isActive
    });
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name && editFormData) {
      // Convert string values to appropriate types
      let processedValue = value;
      
      // Convert string boolean values to actual booleans
      if (name === 'isActive') {
        processedValue = value === 'true';
      }
      
      // Convert string numbers to actual numbers
      if (name === 'storageLimit' && typeof value === 'string') {
        processedValue = Number(value);
      }
      
      setEditFormData({
        ...editFormData,
        [name]: processedValue
      });
    }
  };
  
  const handleUpdateUser = async () => {
    if (!editFormData) return;
    
    try {
      await axios.patch(`${API_ENDPOINTS.ADMIN.USERS}/${editFormData.id}`, {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        storageLimit: editFormData.storageLimit,
        isActive: editFormData.isActive
      });
      
      // Update the user in the local state
      setUsers(prev => 
        prev.map(user => 
          user.id === editFormData.id 
            ? { 
                ...user, 
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
                storageLimit: editFormData.storageLimit,
                isActive: editFormData.isActive
              } 
            : user
        )
      );
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`${API_ENDPOINTS.ADMIN.USERS}/${selectedUser.id}`);
      
      // Remove the user from the local state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setTotalUsers(prev => prev - 1);
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };
  
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };
  
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            User Management
          </Typography>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch} edge="end">
                          <RefreshCw size={20} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  startIcon={<UserPlus size={20} />}
                  sx={{ ml: 1 }}
                >
                  Add User
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      onClick={() => handleSort('name')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Name {getSortIcon('name')}
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('email')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Email {getSortIcon('email')}
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('role')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Role {getSortIcon('role')}
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('createdAt')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Created {getSortIcon('createdAt')}
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('storageUsed')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Storage {getSortIcon('storageUsed')}
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('isActive')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Status {getSortIcon('isActive')}
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={user.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                            icon={<Shield size={16} />}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={format(new Date(user.createdAt), 'PPpp')}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Clock size={16} style={{ marginRight: 8 }} />
                              {format(new Date(user.createdAt), 'PP')}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`${formatBytes(user.storageUsed)} of ${formatBytes(user.storageLimit)} used`}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HardDrive size={16} style={{ marginRight: 8 }} />
                              {formatBytes(user.storageUsed)}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Chip 
                              label="Active" 
                              color="success"
                              size="small"
                              icon={<CheckCircle size={16} />}
                            />
                          ) : (
                            <Chip 
                              label="Inactive" 
                              color="error"
                              size="small"
                              icon={<XCircle size={16} />}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit User">
                            <IconButton onClick={() => handleOpenEditDialog(user)}>
                              <Edit size={20} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton 
                              color="error" 
                              onClick={() => handleOpenDeleteDialog(user)}
                              disabled={user.role === 'admin'} // Prevent deleting admins
                            >
                              <Trash2 size={20} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalUsers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      </Container>
      
      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        {selectedUser && editFormData && (
          <>
            <DialogTitle>Edit User: {selectedUser.name}</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="name"
                      label="Name"
                      fullWidth
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="email"
                      label="Email"
                      fullWidth
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={editFormData.role}
                        label="Role"
                        onChange={handleEditFormChange}
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="isActive"
                        value={editFormData.isActive}
                        label="Status"
                        onChange={handleEditFormChange}
                      >
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="storageLimit"
                      label="Storage Limit (bytes)"
                      fullWidth
                      type="number"
                      value={editFormData.storageLimit}
                      onChange={handleEditFormChange}
                      helperText={`${formatBytes(editFormData.storageLimit)}`}
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog}>Cancel</Button>
              <Button onClick={handleUpdateUser} variant="contained">Save Changes</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        {selectedUser && (
          <>
            <DialogTitle>Delete User</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete the user <strong>{selectedUser.name}</strong> ({selectedUser.email})? 
                This action cannot be undone and all user data will be permanently removed.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
              <Button onClick={handleDeleteUser} color="error" variant="contained">
                Delete User
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </MainLayout>
  );
};

export default AdminUsers;
