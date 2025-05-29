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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Grid
} from '@mui/material';
import { 
  Activity, 
  AlertCircle, 
  Users, 
  Calendar, 
  Clock,
  FileText,
  Upload,
  Download,
  Share2,
  Trash2,
  Star
} from 'lucide-react';
import axios from '../../utils/axios';
import { API_ENDPOINTS } from '../../config/api';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityAnalyticsProps {
  data?: any;
  loading?: boolean;
}

// Helper function to get icon for activity type
const getActivityIcon = (action: string) => {
  switch (action) {
    case 'upload':
      return <Upload size={16} />;
    case 'download':
      return <Download size={16} />;
    case 'share':
      return <Share2 size={16} />;
    case 'delete':
      return <Trash2 size={16} />;
    case 'star':
      return <Star size={16} />;
    case 'login':
      return <Users size={16} />;
    case 'logout':
      return <Users size={16} />;
    default:
      return <Activity size={16} />;
  }
};

// Helper function to get color for activity type
const getActivityColor = (action: string) => {
  switch (action) {
    case 'upload':
      return 'success';
    case 'download':
      return 'info';
    case 'share':
      return 'primary';
    case 'delete':
      return 'error';
    case 'star':
      return 'warning';
    case 'login':
      return 'success';
    case 'logout':
      return 'default';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

const ActivityAnalytics: React.FC<ActivityAnalyticsProps> = ({ data, loading }) => {
  const [activityData, setActivityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(loading || false);

  useEffect(() => {
    if (data) {
      setActivityData(data);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(API_ENDPOINTS.ADMIN.ACTIVITY_ANALYTICS);
        setActivityData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching activity analytics:', error);
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

  if (!activityData) {
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
          Failed to load activity analytics
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Please try again later or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  const { activityByType, activityByDay, mostActiveUsers } = activityData;

  // Calculate total activity count
  const totalActivity = activityByType.reduce((acc: number, curr: any) => acc + curr.count, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Activity Analytics
      </Typography>
      
      {/* Activity Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Activity size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Total Activities</Typography>
              </Box>
              <Typography variant="h4" mt={2}>{totalActivity}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Users size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Active Users</Typography>
              </Box>
              <Typography variant="h4" mt={2}>{mostActiveUsers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Calendar size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Days Tracked</Typography>
              </Box>
              <Typography variant="h4" mt={2}>{activityByDay.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Activity by Type */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Activity by Type</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action Type</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityByType.map((type: any) => (
                <TableRow key={type._id || 'unknown'}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Chip 
                        icon={getActivityIcon(type._id)} 
                        label={type._id || 'Unknown'} 
                        size="small"
                        color={getActivityColor(type._id) as any}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">{type.count}</TableCell>
                  <TableCell align="right">
                    {((type.count / totalActivity) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Most Active Users */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Most Active Users</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Activity Count</TableCell>
                <TableCell align="right">% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mostActiveUsers.map((user: any) => (
                <TableRow key={user.userId}>
                  <TableCell>{user.userName}</TableCell>
                  <TableCell>{user.userEmail}</TableCell>
                  <TableCell align="right">{user.count}</TableCell>
                  <TableCell align="right">
                    {((user.count / totalActivity) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Activity by Day */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Activity by Day</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Activity Count</TableCell>
                <TableCell align="right">% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityByDay.map((day: any) => (
                <TableRow key={day._id}>
                  <TableCell>{day._id}</TableCell>
                  <TableCell align="right">{day.count}</TableCell>
                  <TableCell align="right">
                    {((day.count / totalActivity) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ActivityAnalytics;
