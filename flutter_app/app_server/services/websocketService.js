import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map<userId, Set<WebSocket>>
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    // Extract token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('WebSocket connection without token');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId || decoded._id;

      if (!userId) {
        throw new Error('Invalid token payload');
      }

      // Store client connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      // Store userId on ws object for cleanup
      ws.userId = userId;

      console.log(`✅ WebSocket connected: User ${userId}`);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        userId: userId
      }));

      // Handle incoming messages
      ws.on('message', (message) => {
        this.handleMessage(ws, message, userId);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws, userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, message, userId) {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Message from user ${userId}:`, data);

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(ws, userId) {
    console.log(`❌ WebSocket disconnected: User ${userId}`);
    
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      
      // Clean up empty sets
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Broadcast storage update to specific user
   */
  broadcastStorageUpdate(userId, storageData) {
    if (!this.clients.has(userId)) {
      return; // User not connected
    }

    const message = JSON.stringify({
      type: 'storage_update',
      data: storageData,
      timestamp: Date.now()
    });

    const userClients = this.clients.get(userId);
    userClients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(message);
      }
    });

    console.log(`📊 Storage update sent to user ${userId}:`, storageData);
  }

  /**
   * Broadcast file update to specific user
   */
  broadcastFileUpdate(userId, fileData) {
    if (!this.clients.has(userId)) {
      return;
    }

    const message = JSON.stringify({
      type: 'file_update',
      data: fileData,
      timestamp: Date.now()
    });

    const userClients = this.clients.get(userId);
    userClients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });

    console.log(`📁 File update sent to user ${userId}`);
  }

  /**
   * Broadcast notification to specific user
   */
  broadcastNotification(userId, notification) {
    if (!this.clients.has(userId)) {
      return;
    }

    const message = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: Date.now()
    });

    const userClients = this.clients.get(userId);
    userClients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });

    console.log(`🔔 Notification sent to user ${userId}`);
  }

  /**
   * Get connected client count
   */
  getConnectedClientCount() {
    let count = 0;
    this.clients.forEach((clientSet) => {
      count += clientSet.size;
    });
    return count;
  }

  /**
   * Get connected users count
   */
  getConnectedUserCount() {
    return this.clients.size;
  }
}

// Export singleton instance
export default new WebSocketService();

