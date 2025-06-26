import { io, Socket } from 'socket.io-client';
import { AgentConfig, LLMProviderConfig, Message } from '../types';

export interface RealtimeClientConfig {
  serverUrl: string;
  autoConnect?: boolean;
}

export class RealtimeClient {
  private socket: Socket;
  private config: RealtimeClientConfig;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: RealtimeClientConfig) {
    this.config = {
      autoConnect: true,
      ...config
    };

    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: this.config.autoConnect
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to AI-Gent server');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from AI-Gent server');
      this.emit('disconnected');
    });

    this.socket.on('agent_created', (data) => {
      this.emit('agent_created', data);
    });

    this.socket.on('message_response', (data) => {
      this.emit('message_response', data);
    });

    this.socket.on('stream_chunk', (data) => {
      this.emit('stream_chunk', data);
    });

    this.socket.on('memory_response', (data) => {
      this.emit('memory_response', data);
    });

    this.socket.on('memory_cleared', (data) => {
      this.emit('memory_cleared', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  // Public methods
  public connect(): void {
    this.socket.connect();
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public createAgent(agentId: string, agentConfig: AgentConfig, providerConfig: LLMProviderConfig): void {
    this.socket.emit('create_agent', {
      agentId,
      agentConfig,
      providerConfig
    });
  }

  public sendMessage(agentId: string, content: string, stream: boolean = false): void {
    this.socket.emit('send_message', {
      agentId,
      content,
      stream
    });
  }

  public getMemory(agentId: string): void {
    this.socket.emit('get_memory', { agentId });
  }

  public clearMemory(agentId: string): void {
    this.socket.emit('clear_memory', { agentId });
  }

  // Event handling
  public on(event: string, callback: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  public off(event: string, callback?: Function): void {
    if (!callback) {
      this.eventHandlers.delete(event);
    } else {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Utility methods
  public isConnected(): boolean {
    return this.socket.connected;
  }

  public getSocketId(): string | undefined {
    return this.socket.id;
  }
} 