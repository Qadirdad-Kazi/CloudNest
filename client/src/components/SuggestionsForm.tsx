import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

const SuggestionsForm: React.FC = () => {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !suggestion.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await axios.post(API_ENDPOINTS.FEEDBACK.SUGGESTIONS, {
        title,
        suggestion,
        userId: user?._id
      });
      
      // Reset form
      setTitle('');
      setSuggestion('');
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Thank you for your suggestion!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit suggestion. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Suggest an Improvement
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        We value your feedback! Let us know how we can make CloudNest better for you.
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="title"
          label="Suggestion Title"
          name="title"
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="suggestion"
          label="Your Suggestion"
          id="suggestion"
          multiline
          rows={4}
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </Button>
      </Box>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SuggestionsForm;
