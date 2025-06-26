import { Agent, LLMProvider, AgentConfig, LLMProviderConfig } from '../src';

async function main() {
  // Configure the agent
  const agentConfig: AgentConfig = {
    name: 'Assistant',
    description: 'A helpful AI assistant',
    systemPrompt: 'You are a helpful AI assistant. You can help with various tasks and answer questions.',
    provider: LLMProvider.OPENAI,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    memory: {
      enabled: true,
      maxMessages: 10
    }
  };

  // Configure the provider
  const providerConfig: LLMProviderConfig = {
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    timeout: 30
  };

  // Create the agent
  const agent = new Agent(agentConfig, providerConfig);

  try {
    // Send a message to the agent
    console.log('🤖 AI Agent initialized!');
    console.log('💬 Sending message...');
    
    const response = await agent.sendMessage('Hello! Can you help me with a simple math problem? What is 15 + 27?');
    
    console.log('📝 Response:', response.content);
    
    if (response.usage) {
      console.log('📊 Token usage:', response.usage);
    }

    // Send another message to test memory
    console.log('\n💬 Sending follow-up message...');
    const followUpResponse = await agent.sendMessage('Can you also tell me what 15 * 27 is?');
    
    console.log('📝 Follow-up response:', followUpResponse.content);

    // Show conversation memory
    console.log('\n🧠 Conversation memory:');
    agent.getMemory().forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
} 