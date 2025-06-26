import { BaseLLMProvider, LLMProviderConfig, LLMRequestOptions } from './base';
import { LLMProvider, LLMResponse, Message } from '../types';
import { LLMError } from '../types';
import axios from 'axios';

export class LlamaProvider extends BaseLLMProvider {
  private apiKey?: string;
  private baseURL: string;

  constructor(config: LLMProviderConfig) {
    super(config, LLMProvider.LLAMA);
    this.validateConfig();
    this.apiKey = this.config.apiKey;
    this.baseURL = this.config.baseURL || 'http://localhost:11434'; // Default Ollama URL
  }

  async generateResponse(options: LLMRequestOptions): Promise<LLMResponse> {
    try {
      const messages = this.formatMessagesForLlama(options.messages);
      
      const requestBody = {
        model: options.model,
        messages,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 1000,
        },
        stream: false
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        requestBody,
        {
          headers,
          timeout: this.config.timeout ? this.config.timeout * 1000 : 30000
        }
      );

      const result: LLMResponse = {
        content: response.data.message.content,
      };

      // Add usage if available (Ollama format)
      if (response.data.eval_count) {
        result.usage = {
          promptTokens: response.data.eval_count,
          completionTokens: response.data.eval_count,
          totalTokens: response.data.eval_count,
        };
      }

      return result;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown LLaMA error';
      throw new LLMError(errorMessage, LLMProvider.LLAMA);
    }
  }

  private formatMessagesForLlama(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  protected override validateConfig(): void {
    // LLaMA doesn't always require an API key (local instances)
    if (!this.config.baseURL && !this.config.apiKey) {
      throw new Error('Either baseURL or apiKey is required for LLaMA provider');
    }
  }
} 