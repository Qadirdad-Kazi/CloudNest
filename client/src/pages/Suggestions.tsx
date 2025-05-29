import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import SuggestionsForm from '../components/SuggestionsForm';
import MainLayout from '../components/layout/MainLayout';

const Suggestions: React.FC = () => {
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Help Us Improve CloudNest
          </Typography>
          <Typography variant="body1" paragraph align="center" sx={{ mb: 4 }}>
            Your feedback helps us make CloudNest better for everyone. Share your ideas, report issues, or suggest new features.
          </Typography>
          <SuggestionsForm />
        </Box>
      </Container>
    </MainLayout>
  );
};

export default Suggestions;
