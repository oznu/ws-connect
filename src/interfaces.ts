import * as WebSocketClient from 'ws';

export interface WebSocketOptions {
  options?: WebSocketClient.ClientOptions;
  protocols?: string | string[];
  reconnectInterval?: number;
  pingInterval?: number;
  pingFailureLimit?: number;
  beforeConnect?: (connectionAttempts?: number) => Promise<void>;
}
