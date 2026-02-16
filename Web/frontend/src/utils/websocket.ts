import { API_CONFIG } from '../config/api';

type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000; // Start with 1 second
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  constructor() {
    // Don't auto-connect on construction, let FileContext control it
  }

  public connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connecting or connected
    }

    try {
      this.isConnecting = true;
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found, skipping WebSocket connection');
        this.isConnecting = false;
        return;
      }

      // Build WebSocket URL with /ws path
      const wsUrl = API_CONFIG.WS_URL.replace(/^http/, 'ws') + `/ws?token=${token}`;
      console.log('Attempting WebSocket connection...');
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected - Real-time updates enabled');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.debug('WebSocket connection failed (expected on serverless platforms)');
        this.isConnecting = false;
      };

    } catch (error) {
      console.debug('WebSocket not available (expected on serverless platforms)');
      this.isConnecting = false;
      // Don't retry on security errors (CSP blocks)
      if (error instanceof Error && error.message.includes('insecure')) {
        this.reconnectAttempts = this.maxReconnectAttempts;
      } else {
        this.handleReconnect();
      }
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message);

      // Call all handlers for this message type
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Only log on first few attempts
      if (this.reconnectAttempts <= 2) {
        console.log(`WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      }
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);

      // Exponential backoff
      this.reconnectTimeout *= 2;
    } else {
      console.log('⚠️ Real-time updates unavailable (serverless environment). Using polling fallback.');
    }
  }

  public on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  public off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  public send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient(); 