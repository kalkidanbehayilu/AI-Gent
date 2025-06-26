import { EventEmitter } from 'events';
import { Agent } from '../agent';
import { 
  AgentConfig, 
  RealtimeAgent, 
  RealtimeEventType, 
  LLMResponse, 
  StreamingResponse, 
  Message 
} from '../types';
import { LLMProviderConfig } from '../providers/base';
import { RealtimeError } from '../types';

export class RealtimeAgentImpl extends Agent implements RealtimeAgent {
  public readonly id: string;
  private eventEmitter: EventEmitter;
  private isConnected: boolean = false;

  constructor(
    id: string,
    config: AgentConfig, 
    providerConfig: LLMProviderConfig
  ) {
    super(config, providerConfig);
    this.id = id;
    this.eventEmitter = new EventEmitter();
  }

  override async sendMessage(content: string): Promise<LLMResponse> {
    // Emit message sent event
    this.emit(RealtimeEventType.MESSAGE_SENT, {
      content,
      timestamp: Date.now()
    });

    try {
      const response = await super.sendMessage(content);
      
      // Emit message received event
      this.emit(RealtimeEventType.MESSAGE_RECEIVED, {
        content: response.content,
        usage: response.usage,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      this.emit(RealtimeEventType.ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      throw error;
    }
  }

  async *sendMessageStream(content: string): AsyncGenerator<StreamingResponse> {
    // Emit message sent event
    this.emit(RealtimeEventType.MESSAGE_SENT, {
      content,
      timestamp: Date.now()
    });

    try {
      // Add user message
      this.addMessage({
        role: 'user',
        content
      });

      // Prepare messages for the LLM
      const messagesToSend = this.getMemory();
      let accumulatedContent = '';
      let isComplete = false;

      // For now, we'll simulate streaming by chunking the response
      // In a real implementation, this would use the provider's streaming API
      const response = await super.sendMessage(content);
      
      // Simulate streaming by chunking the response
      const chunkSize = this.config.streaming.chunkSize || 50;
      const chunks = this.chunkString(response.content, chunkSize);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        accumulatedContent += chunk;
        isComplete = i === chunks.length - 1;

        const streamingResponse: StreamingResponse = {
          content: chunk,
          isComplete,
          usage: isComplete ? response.usage : undefined
        };

        // Emit stream chunk event
        this.emit(RealtimeEventType.STREAM_CHUNK, {
          content: chunk,
          isComplete,
          timestamp: Date.now()
        });

        yield streamingResponse;

        // Small delay to simulate real streaming
        if (!isComplete) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Emit stream complete event
      this.emit(RealtimeEventType.STREAM_COMPLETE, {
        content: accumulatedContent,
        usage: response.usage,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emit(RealtimeEventType.ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      throw error;
    }
  }

  emit(event: RealtimeEventType, data: any): void {
    if (!this.isConnected) {
      throw new RealtimeError('Agent is not connected to real-time service');
    }
    
    this.eventEmitter.emit(event, {
      type: event,
      agentId: this.id,
      timestamp: Date.now(),
      data
    });
  }

  on(event: RealtimeEventType, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }

  off(event: RealtimeEventType, callback: (data: any) => void): void {
    this.eventEmitter.off(event, callback);
  }

  // Internal methods for real-time service
  setConnected(connected: boolean): void {
    this.isConnected = connected;
    this.emit(RealtimeEventType.AGENT_STATUS, {
      status: connected ? 'connected' : 'disconnected',
      timestamp: Date.now()
    });
  }

  private chunkString(str: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }
} 