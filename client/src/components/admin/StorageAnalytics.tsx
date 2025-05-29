import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { HardDrive, File, AlertCircle } from 'lucide-react';
import axios from '../../utils/axios';
import { API_ENDPOINTS } from '../../config/api';

interface StorageAnalyticsProps {
  data?: any;
  loading?: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const StorageAnalytics: React.FC<StorageAnalyticsProps> = ({ data, loading }) => {
  const [storageData, setStorageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(loading || false);

  useEffect(() => {
    if (data) {
      setStorageData(data);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(API_ENDPOINTS.ADMIN.STORAGE_ANALYTICS);
        setStorageData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching storage analytics:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [data]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (!storageData) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="300px"
        p={3}
        textAlign="center"
      >
        <AlertCircle size={48} color="#f44336" />
        <Typography variant="h6" color="error" mt={2}>
          Failed to load storage analytics
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Please try again later or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  const { storageByType, storageByUser, storageGrowth } = storageData;

  // Calculate total storage
  const totalStorage = storageByType.reduce((acc: number, curr: any) => acc + curr.totalSize, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Storage Analytics
      </Typography>
      
      {/* Storage Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <HardDrive size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Total Storage</Typography>
              </Box>
              <Typography variant="h4" mt={2}>{formatBytes(totalStorage)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <File size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>File Types</Typography>
              </Box>
              <Typography variant="h4" mt={2}>{storageByType.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <HardDrive size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Average Per User</Typography>
              </Box>
              <Typography variant="h4" mt={2}>
                {formatBytes(storageByUser.length > 0 
                  ? totalStorage / storageByUser.length 
                  : 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Storage by File Type */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Storage by File Type</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Type</TableCell>
                <TableCell align="right">Files</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell align="right">% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {storageByType.map((type: any) => (
                <TableRow key={type._id || 'unknown'}>
                  <TableCell>{type._id || 'Unknown'}</TableCell>
                  <TableCell align="right">{type.count}</TableCell>
                  <TableCell align="right">{formatBytes(type.totalSize)}</TableCell>
                  <TableCell align="right">
                    {((type.totalSize / totalStorage) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Top Storage Users */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Top Storage Users</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Files</TableCell>
                <TableCell align="right">Storage Used</TableCell>
                <TableCell align="right">% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {storageByUser.map((user: any) => (
                <TableRow key={user.userId}>
                  <TableCell>{user.userName}</TableCell>
                  <TableCell>{user.userEmail}</TableCell>
                  <TableCell align="right">{user.count}</TableCell>
                  <TableCell align="right">{formatBytes(user.totalSize)}</TableCell>
                  <TableCell align="right">
                    {((user.totalSize / totalStorage) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Storage Growth Over Time */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Storage Growth (Last 30 Days)</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Files Added</TableCell>
                <TableCell align="right">Storage Added</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {storageGrowth.map((day: any) => (
                <TableRow key={day._id}>
                  <TableCell>{day._id}</TableCell>
                  <TableCell align="right">{day.count}</TableCell>
                  <TableCell align="right">{formatBytes(day.totalSize)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StorageAnalytics;
