import React, { useState, useEffect } from 'react';
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
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';
import { formatDistanceToNow } from 'date-fns';

interface Suggestion {
  id: string;
  title: string;
  suggestion: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
}

const AdminSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [status, setStatus] = useState<'pending' | 'reviewed' | 'implemented' | 'rejected'>('pending');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.FEEDBACK.ADMIN_SUGGESTIONS);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
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

  const handleOpenDialog = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setAdminResponse(suggestion.adminResponse || '');
    setStatus(suggestion.status);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSuggestion(null);
  };

  const handleUpdateSuggestion = async () => {
    if (!selectedSuggestion) return;

    try {
      await axios.patch(`${API_ENDPOINTS.FEEDBACK.ADMIN_SUGGESTIONS}/${selectedSuggestion.id}`, {
        status,
        adminResponse
      });
      
      // Update the suggestion in the local state
      setSuggestions(prev => 
        prev.map(s => 
          s.id === selectedSuggestion.id 
            ? { ...s, status, adminResponse, updatedAt: new Date().toISOString() } 
            : s
        )
      );
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'implemented':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Manage User Suggestions
          </Typography>
          <Typography variant="body1" paragraph>
            Review and respond to user suggestions to improve CloudNest.
          </Typography>

          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Loading suggestions...</TableCell>
                    </TableRow>
                  ) : suggestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No suggestions found</TableCell>
                    </TableRow>
                  ) : (
                    suggestions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((suggestion) => (
                        <TableRow key={suggestion.id}>
                          <TableCell>{suggestion.title}</TableCell>
                          <TableCell>{suggestion.userName || suggestion.userEmail || 'Anonymous'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)} 
                              color={getStatusColor(suggestion.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => handleOpenDialog(suggestion)}
                            >
                              Review
                            </Button>
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
              count={suggestions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      </Container>

      {/* Review Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedSuggestion && (
          <>
            <DialogTitle>{selectedSuggestion.title}</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                {selectedSuggestion.suggestion}
              </DialogContentText>
              
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="reviewed">Reviewed</MenuItem>
                    <MenuItem value="implemented">Implemented</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Admin Response"
                  multiline
                  rows={4}
                  fullWidth
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Provide a response to this suggestion..."
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: 14 }}>
                <span>Submitted: {new Date(selectedSuggestion.createdAt).toLocaleString()}</span>
                {selectedSuggestion.updatedAt !== selectedSuggestion.createdAt && (
                  <span>Last updated: {new Date(selectedSuggestion.updatedAt).toLocaleString()}</span>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleUpdateSuggestion} variant="contained">Save Response</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </MainLayout>
  );
};

export default AdminSuggestions;
