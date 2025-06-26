import { LLMProvider, LLMResponse, Message } from '../types';

export interface LLMProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface LLMRequestOptions {
  messages: Message[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;
  public readonly provider: LLMProvider;

  constructor(config: LLMProviderConfig, provider: LLMProvider) {
    this.config = config;
    this.provider = provider;
  }

  abstract generateResponse(options: LLMRequestOptions): Promise<LLMResponse>;

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.provider} provider`);
    }
  }

  protected formatMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
      ...(msg.function_call && { function_call: msg.function_call })
    }));
  }
} 