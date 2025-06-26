import { Agent, LLMProvider, AgentConfig, LLMProviderConfig, FunctionDefinition } from '../src';
import { defaultTools } from '../src/tools';

async function main() {
  // Configure the agent with tools
  const agentConfig: AgentConfig = {
    name: 'Tool Assistant',
    description: 'An AI assistant that can use various tools',
    systemPrompt: `You are a helpful AI assistant with access to various tools. You can:
    - Make HTTP requests to APIs
    - Perform calculations
    - Get current date/time
    - Read and write files
    - Get weather information (if API key provided)
    
    Use the available tools when appropriate to help users.`,
    provider: LLMProvider.OPENAI,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1500,
    memory: {
      enabled: true,
      maxMessages: 15
    }
  };

  // Configure the provider
  const providerConfig: LLMProviderConfig = {
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    timeout: 30
  };

  // Create the agent
  const agent = new Agent(agentConfig, providerConfig);

  // Register tools
  defaultTools.forEach(tool => {
    agent.registerTool(tool);
  });

  // Register a custom function
  const customFunction: FunctionDefinition = {
    name: 'get_user_info',
    description: 'Get information about the current user',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The user ID to get info for'
        }
      },
      required: ['userId']
    },
    handler: async (args: { userId: string }) => {
      // Simulate getting user info
      return {
        userId: args.userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        lastLogin: new Date().toISOString()
      };
    }
  };

  agent.registerFunction(customFunction);

  try {
    console.log('🤖 AI Agent with tools initialized!');
    
    // Test calculator tool
    console.log('\n🧮 Testing calculator...');
    const calcResult = await agent.executeTool('calculator', { expression: '15 * 27 + 100' });
    console.log('Calculator result:', calcResult);

    // Test datetime tool
    console.log('\n⏰ Testing datetime...');
    const timeResult = await agent.executeTool('datetime', { operation: 'now' });
    console.log('Current time:', timeResult);

    // Test HTTP request tool
    console.log('\n🌐 Testing HTTP request...');
    const httpResult = await agent.executeTool('http_request', {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1'
    });
    console.log('HTTP response status:', httpResult.status);

    // Send a message that might use tools
    console.log('\n💬 Sending message that might use tools...');
    const response = await agent.sendMessage('Can you calculate 25 * 4 + 10 and tell me the current time?');
    console.log('📝 Response:', response.content);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
} 