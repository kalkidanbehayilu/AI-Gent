import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Agent, AgentConfig, LLMProviderConfig, RealtimeEventType, WebSocketMessage } from '../types';
import { LLMProviderFactory } from '../providers/factory';
import { RealtimeError } from '../types';

export interface RealtimeServerConfig {
  port?: number;
  cors?: {
    origin: string | string[];
    methods: string[];
  };
}

export class RealtimeServer {
  private io: SocketIOServer;
  private agents: Map<string, Agent> = new Map();
  private config: RealtimeServerConfig;

  constructor(httpServer: HTTPServer, config: RealtimeServerConfig = {}) {
    this.config = {
      port: 3001,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      ...config
    };

    this.io = new SocketIOServer(httpServer, {
      cors: this.config.cors,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle agent creation
      socket.on('create_agent', async (data: {
        agentId: string;
        agentConfig: AgentConfig;
        providerConfig: LLMProviderConfig;
      }) => {
        try {
          const agent = new Agent(data.agentConfig, data.providerConfig);
          this.agents.set(data.agentId, agent);
          
          socket.join(`agent:${data.agentId}`);
          
          socket.emit('agent_created', {
            agentId: data.agentId,
            status: 'success'
          });

          console.log(`Agent created: ${data.agentId}`);
        } catch (error) {
          socket.emit('error', {
            type: 'agent_creation_error',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle message sending
      socket.on('send_message', async (data: {
        agentId: string;
        content: string;
        stream?: boolean;
      }) => {
        try {
          const agent = this.agents.get(data.agentId);
          if (!agent) {
            throw new RealtimeError(`Agent ${data.agentId} not found`);
          }

          if (data.stream) {
            // Handle streaming response
            await this.handleStreamingMessage(socket, data.agentId, data.content);
          } else {
            // Handle regular response
            const response = await agent.sendMessage(data.content);
            
            socket.emit('message_response', {
              agentId: data.agentId,
              content: response.content,
              usage: response.usage,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          socket.emit('error', {
            type: 'message_error',
            agentId: data.agentId,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle agent memory requests
      socket.on('get_memory', (data: { agentId: string }) => {
        try {
          const agent = this.agents.get(data.agentId);
          if (!agent) {
            throw new RealtimeError(`Agent ${data.agentId} not found`);
          }

          socket.emit('memory_response', {
            agentId: data.agentId,
            memory: agent.getMemory(),
            timestamp: Date.now()
          });
        } catch (error) {
          socket.emit('error', {
            type: 'memory_error',
            agentId: data.agentId,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle agent memory clearing
      socket.on('clear_memory', (data: { agentId: string }) => {
        try {
          const agent = this.agents.get(data.agentId);
          if (!agent) {
            throw new RealtimeError(`Agent ${data.agentId} not found`);
          }

          agent.clearMemory();
          
          socket.emit('memory_cleared', {
            agentId: data.agentId,
            timestamp: Date.now()
          });
        } catch (error) {
          socket.emit('error', {
            type: 'memory_error',
            agentId: data.agentId,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async handleStreamingMessage(socket: any, agentId: string, content: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new RealtimeError(`Agent ${agentId} not found`);
    }

    // For now, simulate streaming by sending chunks
    // In a real implementation, this would use the provider's streaming API
    const response = await agent.sendMessage(content);
    const chunks = this.chunkString(response.content, 50);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isComplete = i === chunks.length - 1;

      socket.emit('stream_chunk', {
        agentId,
        content: chunk,
        isComplete,
        usage: isComplete ? response.usage : undefined,
        timestamp: Date.now()
      });

      // Small delay to simulate real streaming
      if (!isComplete) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private chunkString(str: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }

  // Public methods
  public getAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  public removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  public broadcastToAgent(agentId: string, event: string, data: any): void {
    this.io.to(`agent:${agentId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }
} 