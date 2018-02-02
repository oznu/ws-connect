import { EventEmitter } from 'events';
import * as WebSocketClient from 'ws';

import { WebSocketOptions } from './interfaces';

export = class WebSocket extends EventEmitter {

  public ws: WebSocketClient;
  private address: string;
  private protocols?: string | string[];
  private options?: WebSocketClient.ClientOptions;

  private reconnecting: boolean;
  private reconnectInterval: number;
  private pingInterval: number;
  private pingTimeout: number;
  private pingFailureLimit: number;

  private pong;
  private ping;
  private connectionAttempt = 0;
  private closed = false;

  constructor(
    address: string,
    options: WebSocketOptions = {},
  ) {
    super();

    this.address = address;
    this.protocols = options.protocols || [];
    this.options = options.options || {};
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.pingInterval = options.pingInterval || 10000;
    this.pingFailureLimit = options.pingFailureLimit || 2;
    this.pingTimeout = (this.pingInterval * this.pingFailureLimit) + 100;

    this.init();
  }

  private init() {
    this.connectionAttempt++;
    const attempt = this.connectionAttempt;

    const ws: WebSocketClient = new WebSocketClient(this.address, this.protocols, this.options);
    this.ws = ws;

    // Ping the server every x seconds to make sure the server is alive
    this.ping = setInterval(() => {
      if (ws.readyState === 1) {
        ws.ping('ping', true);
      }
    }, this.pingInterval);

    // If the server does not respond with pong for x consecutive pings start a reconnect
    const pongTimeout = () => {
      this.emit('websocket-status', `Lost Connection (${attempt}) - No ping back for ${this.pingTimeout}ms.`);
      this.reconnect();
    };

    // Received pong back from server
    ws.on('pong', () => {
      clearTimeout(this.pong);
      this.emit('pong');
      this.pong = setTimeout(pongTimeout.bind(this), this.pingTimeout);
    });

    // Connection open
    ws.on('open', () => {
      this.reconnecting = false;
      this.emit('open');
      this.emit('websocket-status', `Connected (${attempt}) - ${this.address}`);
      this.pong = setTimeout(pongTimeout.bind(this), this.pingTimeout);
    });

    // Connection closed - try reconnect
    ws.on('close', (code: number, reason: string) => {
      this.emit('close', code, reason);
      this.reconnect();
    });

    // Connection error - try reconnect
    ws.on('error', (e) => {
      this.emit('websocket-status', `Error (${attempt}) - ${e.message}`);
      this.reconnect();
    });

    // Received data - pass through
    ws.on('message', (msg: string) => {
      this.emit('message', msg);

      try {
        this.emit('json', JSON.parse(msg));
      } catch (e) { /* not json */ }
    });
  }

  private reconnect() {
    clearInterval(this.ping);
    clearTimeout(this.pong);

    if (!this.reconnecting && !this.closed) {
      this.reconnecting = true;
      this.emit('websocket-status', `Disconnected (${this.connectionAttempt}) - Retry in ${this.reconnectInterval}ms`);

      // cleanup
      this.ws.removeAllListeners();
      this.ws.terminate();

      setTimeout(() => {
        this.reconnecting = false;
        this.emit('websocket-status', `Reconnecting (${this.connectionAttempt})`);
        this.init();
      }, this.reconnectInterval);
    }
  }

  public send(msg, callback?: (err: Error) => void) {
    if (this.ws.readyState === 1) {
      this.ws.send(msg, callback);
    }
  }

  public sendJson(msg, callback?: (err: Error) => void) {
    this.send(JSON.stringify(msg), callback);
  }

  public close(code?: number, reason?: string) {
    clearInterval(this.ping);
    clearTimeout(this.pong);
    this.closed = true;
    this.ws.close(code, reason);
    this.emit('websocket-status', `Closed (${this.connectionAttempt})`);
  }

};
