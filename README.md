# AI-Gent 🤖

A powerful Node.js package for creating AI agents using various LLM providers. Build intelligent, conversational AI agents with ease!

## Features

- 🚀 **Multiple LLM Providers**: Support for OpenAI, Claude, LLaMA, and custom providers
- 🧠 **Conversation Memory**: Built-in memory management for context-aware conversations
- 🛠️ **Tool Integration**: Easy integration with custom tools and functions
- 🔧 **Function Calling**: Native support for OpenAI function calling
- 📝 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- 🎯 **Flexible Configuration**: Highly configurable agents with various options
- 🧪 **Built-in Tools**: HTTP requests, file operations, calculations, and more

## Installation

```bash
npm install ai-gent
```

## Quick Start

```typescript
import { Agent, LLMProvider } from 'ai-gent';

// Configure your agent
const agentConfig = {
  name: 'Assistant',
  systemPrompt: 'You are a helpful AI assistant.',
  provider: LLMProvider.OPENAI,
  model: 'gpt-3.5-turbo',
  temperature: 0.7
};

// Configure your provider
const providerConfig = {
  apiKey: process.env.OPENAI_API_KEY
};

// Create and use the agent
const agent = new Agent(agentConfig, providerConfig);

const response = await agent.sendMessage('Hello! How are you?');
console.log(response.content);
```

## Supported Providers

### OpenAI
```typescript
import { LLMProvider } from 'ai-gent';

const config = {
  provider: LLMProvider.OPENAI,
  model: 'gpt-3.5-turbo', // or 'gpt-4', 'gpt-4-turbo', etc.
  apiKey: 'your-openai-api-key'
};
```

### Claude
```typescript
import { LLMProvider } from 'ai-gent';

const config = {
  provider: LLMProvider.CLAUDE,
  model: 'claude-3-sonnet-20240229', // or other Claude models
  apiKey: 'your-claude-api-key'
};
```

### LLaMA
```typescript
import { LLMProvider } from 'ai-gent';

// For local Ollama instance
const config = {
  provider: LLMProvider.LLAMA,
  model: 'llama2', // or other LLaMA models
  baseURL: 'http://localhost:11434' // Optional, defaults to Ollama
};

// For hosted LLaMA instance
const config = {
  provider: LLMProvider.LLAMA,
  model: 'llama2',
  baseURL: 'https://your-llama-host.com',
  apiKey: 'your-api-key' // Optional
};
```

## Agent Configuration

```typescript
import { AgentConfig, LLMProvider } from 'ai-gent';

const agentConfig: AgentConfig = {
  name: 'My Agent',
  description: 'A custom AI agent',
  systemPrompt: 'You are a helpful assistant.',
  provider: LLMProvider.OPENAI,
  model: 'gpt-3.5-turbo',
  temperature: 0.7, // 0.0 to 2.0
  maxTokens: 1000,
  memory: {
    enabled: true,
    maxMessages: 10
  }
};
```

## Using Tools

AI-Gent comes with built-in tools and supports custom tools:

```typescript
import { Agent, defaultTools } from 'ai-gent';

const agent = new Agent(agentConfig, providerConfig);

// Register built-in tools
defaultTools.forEach(tool => agent.registerTool(tool));

// Create custom tool
const customTool = {
  name: 'my_custom_tool',
  description: 'A custom tool for specific tasks',
  execute: async (args: Record<string, any>) => {
    // Your tool logic here
    return { result: 'success' };
  }
};

agent.registerTool(customTool);

// Use tools directly
const result = await agent.executeTool('calculator', { expression: '2 + 2' });
```

## Built-in Tools

### HTTP Request Tool
```typescript
const result = await agent.executeTool('http_request', {
  method: 'GET',
  url: 'https://api.example.com/data'
});
```

### Calculator Tool
```typescript
const result = await agent.executeTool('calculator', {
  expression: '15 * 27 + 100'
});
```

### File System Tool
```typescript
// Read file
const content = await agent.executeTool('file_system', {
  operation: 'read',
  path: './data.txt'
});

// Write file
await agent.executeTool('file_system', {
  operation: 'write',
  path: './output.txt',
  content: 'Hello World!'
});
```

### DateTime Tool
```typescript
const now = await agent.executeTool('datetime', {
  operation: 'now'
});
```

## Function Calling

Register custom functions that the AI can call:

```typescript
import { FunctionDefinition } from 'ai-gent';

const getUserInfo: FunctionDefinition = {
  name: 'get_user_info',
  description: 'Get user information by ID',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID'
      }
    },
    required: ['userId']
  },
  handler: async (args: { userId: string }) => {
    // Your function logic here
    return {
      userId: args.userId,
      name: 'John Doe',
      email: 'john@example.com'
    };
  }
};

agent.registerFunction(getUserInfo);
```

## Memory Management

```typescript
// Get conversation memory
const memory = agent.getMemory();

// Clear memory (keeps system message)
agent.clearMemory();

// Memory is automatically managed based on configuration
const config = {
  memory: {
    enabled: true,
    maxMessages: 10 // Keep last 10 messages
  }
};
```

## Error Handling

```typescript
import { AIGentError, LLMError, ConfigurationError } from 'ai-gent';

try {
  const response = await agent.sendMessage('Hello');
} catch (error) {
  if (error instanceof LLMError) {
    console.error('LLM Error:', error.message);
  } else if (error instanceof ConfigurationError) {
    console.error('Configuration Error:', error.message);
  } else {
    console.error('Unknown Error:', error);
  }
}
```

## Environment Variables

Set up your API keys as environment variables:

```bash
# .env file
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
```

## Examples

Check out the `examples/` directory for complete working examples:

- `basic-agent.ts` - Simple agent usage
- `agent-with-tools.ts` - Agent with tools and functions

## API Reference

### Agent Class

#### Constructor
```typescript
new Agent(config: AgentConfig, providerConfig: LLMProviderConfig)
```

#### Methods
- `sendMessage(content: string): Promise<LLMResponse>`
- `addMessage(message: Message): void`
- `clearMemory(): void`
- `getMemory(): Message[]`
- `registerFunction(definition: FunctionDefinition): void`
- `unregisterFunction(name: string): void`
- `registerTool(tool: Tool): void`
- `unregisterTool(name: string): void`
- `executeTool(name: string, args: Record<string, any>): Promise<any>`

### Types

- `AgentConfig` - Agent configuration
- `LLMProviderConfig` - Provider configuration
- `Message` - Conversation message
- `LLMResponse` - LLM response
- `FunctionDefinition` - Function definition
- `Tool` - Tool definition

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 📧 Email: support@ai-gent.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/ai-gent/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/your-username/ai-gent/wiki) 