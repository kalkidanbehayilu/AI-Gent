import { Agent as IAgent, AgentConfig, Message, LLMResponse, FunctionDefinition, Tool } from './types';
import { LLMProviderFactory } from './providers/factory';
import { BaseLLMProvider, LLMProviderConfig } from './providers/base';
import { ConfigurationError } from './types';

export class Agent implements IAgent {
  public config: AgentConfig;
  public messages: Message[] = [];
  private provider: BaseLLMProvider;
  private functions: Map<string, FunctionDefinition> = new Map();
  private tools: Map<string, Tool> = new Map();

  constructor(config: AgentConfig, providerConfig: LLMProviderConfig) {
    this.config = config;
    
    // Validate configuration
    LLMProviderFactory.validateProviderConfig(config['provider'], providerConfig);
    
    // Create provider
    this['provider'] = LLMProviderFactory.createProvider(config['provider'], providerConfig);
    
    // Initialize with system message
    this.addMessage({
      role: 'system',
      content: config['systemPrompt']
    });
  }

  async sendMessage(content: string): Promise<LLMResponse> {
    // Add user message
    this.addMessage({
      role: 'user',
      content
    });

    try {
      // Prepare messages for the LLM
      const messagesToSend = this.getMemory();

      // Prepare functions if any are registered
      const functions = this.functions.size > 0 
        ? Array.from(this.functions.values()).map(fn => ({
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
          }))
        : undefined;

      // Generate response from LLM
      const requestOptions: any = {
        messages: messagesToSend,
        model: this.config['model'],
        temperature: this.config['temperature'],
        maxTokens: this.config['maxTokens'],
      };

      if (functions) {
        requestOptions.functions = functions;
      }

      const response = await this['provider'].generateResponse(requestOptions);

      // Add assistant response to memory
      this.addMessage({
        role: 'assistant',
        content: response.content
      });

      // Handle function calls if present
      if (response.functionCall) {
        await this.handleFunctionCall(response.functionCall);
      }

      return response;
    } catch (error) {
      // Remove the user message if there was an error
      this.messages.pop();
      throw error;
    }
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    
    // Manage memory if enabled
    if (this.config['memory'].enabled) {
      this.manageMemory();
    }
  }

  clearMemory(): void {
    // Keep only the system message
    const systemMessage = this.messages.find(msg => msg.role === 'system');
    this.messages = systemMessage ? [systemMessage] : [];
  }

  getMemory(): Message[] {
    return [...this.messages];
  }

  // Function management
  registerFunction(definition: FunctionDefinition): void {
    this.functions.set(definition.name, definition);
  }

  unregisterFunction(name: string): void {
    this.functions.delete(name);
  }

  // Tool management
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ConfigurationError(`Tool '${name}' not found`);
    }
    return await tool.execute(args);
  }

  private async handleFunctionCall(functionCall: { name: string; arguments: Record<string, any> }): Promise<void> {
    const functionDef = this.functions.get(functionCall.name);
    if (!functionDef) {
      throw new ConfigurationError(`Function '${functionCall.name}' not found`);
    }

    try {
      const result = await functionDef.handler(functionCall.arguments);
      
      // Add function result to conversation
      this.addMessage({
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify(result)
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown function error';
      this.addMessage({
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify({ error: errorMessage })
      });
    }
  }

  private manageMemory(): void {
    if (this.messages.length <= this.config['memory'].maxMessages) {
      return;
    }

    // Keep system message and recent messages
    const systemMessage = this.messages.find(msg => msg.role === 'system');
    const recentMessages = this.messages
      .filter(msg => msg.role !== 'system')
      .slice(-this.config['memory'].maxMessages + 1);

    this.messages = systemMessage 
      ? [systemMessage, ...recentMessages]
      : recentMessages;
  }
} 