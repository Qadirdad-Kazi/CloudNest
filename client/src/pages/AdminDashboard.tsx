import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { BarChart2, HardDrive, Activity, Server, RefreshCw } from 'lucide-react';
import StorageAnalytics from '../components/admin/StorageAnalytics';
import ActivityAnalytics from '../components/admin/ActivityAnalytics';
import SystemMonitoring from '../components/admin/SystemMonitoring';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalStorage: number;
  filesByType: Array<{ _id: string; count: number }>;
  recentActivity?: Array<{
    id: string;
    userId: { name: string; email: string };
    action: string;
    resourceType: string;
    details: string;
    timestamp: string;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [storageAnalyticsData, setStorageAnalyticsData] = useState(null);
  const [activityAnalyticsData, setActivityAnalyticsData] = useState(null);
  const [systemHealthData, setSystemHealthData] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.ADMIN.DASHBOARD);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  const fetchStorageAnalytics = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN.STORAGE_ANALYTICS);
      setStorageAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching storage analytics:', error);
    }
  };

  const fetchActivityAnalytics = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN.ACTIVITY_ANALYTICS);
      setActivityAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH);
      setSystemHealthData(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    
    Promise.all([
      fetchDashboardStats(),
      fetchStorageAnalytics(),
      fetchActivityAnalytics(),
      fetchSystemHealth()
    ]).finally(() => {
      setLoading(false);
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Fetch data for the selected tab if not already loaded
    if (newValue === 1 && !storageAnalyticsData) {
      fetchStorageAnalytics();
    } else if (newValue === 2 && !activityAnalyticsData) {
      fetchActivityAnalytics();
    } else if (newValue === 3 && !systemHealthData) {
      fetchSystemHealth();
    }
  };

  if (loading && !stats) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h5" component="div">
                  {stats?.totalUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h5" component="div">
                  {stats?.activeUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Files
                </Typography>
                <Typography variant="h5" component="div">
                  {stats?.totalFiles || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Storage
                </Typography>
                <Typography variant="h5" component="div">
                  {formatBytes(stats?.totalStorage || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
              <Tab icon={<BarChart2 size={16} />} iconPosition="start" label="Overview" {...a11yProps(0)} />
              <Tab icon={<HardDrive size={16} />} iconPosition="start" label="Storage" {...a11yProps(1)} />
              <Tab icon={<Activity size={16} />} iconPosition="start" label="Activity" {...a11yProps(2)} />
              <Tab icon={<Server size={16} />} iconPosition="start" label="System" {...a11yProps(3)} />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography paragraph>
              Welcome to the CloudNest Admin Dashboard. Use the tabs above to navigate between different sections.
            </Typography>
            
            {stats?.recentActivity && stats.recentActivity.length > 0 && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List>
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemAvatar>
                        <Avatar>{activity.userId.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${activity.action} ${activity.resourceType}`}
                        secondary={`${activity.userId.name} - ${new Date(activity.timestamp).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <StorageAnalytics data={storageAnalyticsData} loading={!storageAnalyticsData && tabValue === 1} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ActivityAnalytics data={activityAnalyticsData} loading={!activityAnalyticsData && tabValue === 2} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <SystemMonitoring data={systemHealthData} loading={!systemHealthData && tabValue === 3} />
          </TabPanel>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default AdminDashboard;
