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
  ListItemIcon,
  Chip,
  Grid
} from '@mui/material';
import { 
  Activity, 
  AlertCircle, 
  Database, 
  Server, 
  Cpu, 
  Memory
} from 'lucide-react';
import axios from '../../utils/axios';
import { API_ENDPOINTS } from '../../config/api';
import { format, formatDistanceToNow } from 'date-fns';

interface SystemMonitoringProps {
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

const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ data, loading }) => {
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(loading || false);

  useEffect(() => {
    if (data) {
      setSystemData(data);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH);
        setSystemData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching system health data:', error);
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

  if (!systemData) {
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
          Failed to load system health data
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Please try again later or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  const { dbStats, recentErrors, systemMetrics } = systemData;

  // Get latest metrics for CPU, memory, etc.
  const getLatestMetricByLabel = (label: string) => {
    const metrics = systemMetrics.filter((m: any) => m.label === label);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  };

  const cpuMetric = getLatestMetricByLabel('CPU Load (1m)');
  const memoryMetric = getLatestMetricByLabel('Memory Usage (%)');
  const uptimeMetric = getLatestMetricByLabel('System Uptime (s)');

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        System Monitoring
      </Typography>
      
      {/* System Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Cpu size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>CPU Load</Typography>
              </Box>
              <Typography variant="h4" mt={2}>
                {cpuMetric ? `${cpuMetric.value.toFixed(2)}` : 'N/A'}
              </Typography>
              {cpuMetric && (
                <Typography variant="body2" color="textSecondary">
                  Last updated: {formatDistanceToNow(new Date(cpuMetric.timestamp))} ago
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Memory size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Memory Usage</Typography>
              </Box>
              <Typography variant="h4" mt={2}>
                {memoryMetric ? `${memoryMetric.value.toFixed(1)}%` : 'N/A'}
              </Typography>
              {memoryMetric && (
                <Typography variant="body2" color="textSecondary">
                  Last updated: {formatDistanceToNow(new Date(memoryMetric.timestamp))} ago
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Server size={24} color="#3f51b5" />
                <Typography variant="h6" ml={1}>Uptime</Typography>
              </Box>
              <Typography variant="h4" mt={2}>
                {uptimeMetric ? formatUptime(uptimeMetric.value) : 'N/A'}
              </Typography>
              {uptimeMetric && (
                <Typography variant="body2" color="textSecondary">
                  Last updated: {formatDistanceToNow(new Date(uptimeMetric.timestamp))} ago
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Database Stats */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Database Statistics</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box textAlign="center" p={2}>
              <Database size={32} color="#3f51b5" style={{ margin: '0 auto' }} />
              <Typography variant="h6" mt={1}>{dbStats.collections}</Typography>
              <Typography variant="body2" color="textSecondary">Collections</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center" p={2}>
              <Database size={32} color="#3f51b5" style={{ margin: '0 auto' }} />
              <Typography variant="h6" mt={1}>{dbStats.objects}</Typography>
              <Typography variant="body2" color="textSecondary">Objects</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center" p={2}>
              <Database size={32} color="#3f51b5" style={{ margin: '0 auto' }} />
              <Typography variant="h6" mt={1}>{formatBytes(dbStats.dataSize)}</Typography>
              <Typography variant="body2" color="textSecondary">Data Size</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center" p={2}>
              <Database size={32} color="#3f51b5" style={{ margin: '0 auto' }} />
              <Typography variant="h6" mt={1}>{dbStats.indexes}</Typography>
              <Typography variant="body2" color="textSecondary">Indexes</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Recent Errors */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Recent Errors (Last 24 Hours)</Typography>
        {recentErrors.length > 0 ? (
          <List>
            {recentErrors.map((error: any) => (
              <ListItem key={error._id} divider>
                <ListItemIcon>
                  <AlertCircle color="#f44336" />
                </ListItemIcon>
                <ListItemText
                  primary={error.details}
                  secondary={`${format(new Date(error.timestamp), 'PPpp')} - Resource: ${error.resourceType}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="textSecondary">
              No errors reported in the last 24 hours
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* System Metrics Over Time */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>System Metrics (Last 7 Days)</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {systemMetrics.slice(-20).map((metric: any) => (
                <TableRow key={metric._id}>
                  <TableCell>{metric.label}</TableCell>
                  <TableCell>
                    {metric.label.includes('bytes') 
                      ? formatBytes(metric.value)
                      : metric.label.includes('%')
                        ? `${metric.value.toFixed(1)}%`
                        : metric.value.toString()}
                  </TableCell>
                  <TableCell>{format(new Date(metric.timestamp), 'PPp')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SystemMonitoring;
