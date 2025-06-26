import { Agent, LLMProvider, AgentConfig, LLMProviderConfig } from '../src';
import { EventEmitter } from 'events';

// Simple real-time wrapper for demonstration
class SimpleRealtimeAgent extends EventEmitter {
  private agent: Agent;
  public readonly id: string;

  constructor(id: string, agent: Agent) {
    super();
    this.id = id;
    this.agent = agent;
  }

  async sendMessage(content: string): Promise<any> {
    // Emit message sent event
    this.emit('message_sent', {
      agentId: this.id,
      content,
      timestamp: Date.now()
    });

    try {
      const response = await this.agent.sendMessage(content);
      
      // Emit message received event
      this.emit('message_received', {
        agentId: this.id,
        content: response.content,
        usage: response.usage,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      this.emit('error', {
        agentId: this.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      throw error;
    }
  }

  async *sendMessageStream(content: string): AsyncGenerator<any> {
    // Emit message sent event
    this.emit('message_sent', {
      agentId: this.id,
      content,
      timestamp: Date.now()
    });

    try {
      const response = await this.agent.sendMessage(content);
      
      // Simulate streaming by chunking the response
      const chunks = this.chunkString(response.content, 50);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isComplete = i === chunks.length - 1;

        // Emit stream chunk event
        this.emit('stream_chunk', {
          agentId: this.id,
          content: chunk,
          isComplete,
          timestamp: Date.now()
        });

        yield {
          content: chunk,
          isComplete,
          usage: isComplete ? response.usage : undefined
        };

        // Small delay to simulate real streaming
        if (!isComplete) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Emit stream complete event
      this.emit('stream_complete', {
        agentId: this.id,
        content: response.content,
        usage: response.usage,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emit('error', {
        agentId: this.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      throw error;
    }
  }

  getMemory(): any[] {
    return this.agent.getMemory();
  }

  clearMemory(): void {
    this.agent.clearMemory();
    this.emit('memory_cleared', {
      agentId: this.id,
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

async function main() {
  // Configure the agent
  const agentConfig: AgentConfig = {
    name: 'Realtime Assistant',
    description: 'A real-time AI assistant with streaming capabilities',
    systemPrompt: 'You are a helpful AI assistant. Provide detailed and engaging responses.',
    provider: LLMProvider.OPENAI,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    memory: {
      enabled: true,
      maxMessages: 10
    },
    streaming: {
      enabled: true,
      chunkSize: 50
    }
  };

  // Configure the provider
  const providerConfig: LLMProviderConfig = {
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    timeout: 30
  };

  // Create the base agent
  const baseAgent = new Agent(agentConfig, providerConfig);
  
  // Wrap it with real-time capabilities
  const realtimeAgent = new SimpleRealtimeAgent('agent-001', baseAgent);

  // Set up event listeners
  realtimeAgent.on('message_sent', (data) => {
    console.log('📤 Message sent:', data);
  });

  realtimeAgent.on('message_received', (data) => {
    console.log('📥 Message received:', data);
  });

  realtimeAgent.on('stream_chunk', (data) => {
    process.stdout.write(data.content); // Print chunks as they arrive
  });

  realtimeAgent.on('stream_complete', (data) => {
    console.log('\n✅ Stream complete');
  });

  realtimeAgent.on('memory_cleared', (data) => {
    console.log('🧹 Memory cleared:', data);
  });

  realtimeAgent.on('error', (data) => {
    console.error('❌ Error:', data);
  });

  try {
    console.log('🤖 Real-time AI Agent initialized!');
    
    // Test regular message
    console.log('\n💬 Sending regular message...');
    const response = await realtimeAgent.sendMessage('Hello! Tell me a short joke.');
    console.log('\n📝 Full response:', response.content);

    // Test streaming message
    console.log('\n🌊 Sending streaming message...');
    console.log('Streaming response: ');
    for await (const chunk of realtimeAgent.sendMessageStream('Explain quantum computing in simple terms.')) {
      // Chunks are already printed by the event listener
    }

    // Test memory operations
    console.log('\n🧠 Getting memory...');
    const memory = realtimeAgent.getMemory();
    console.log('Memory length:', memory.length);

    // Test memory clearing
    console.log('\n🧹 Clearing memory...');
    realtimeAgent.clearMemory();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
} 