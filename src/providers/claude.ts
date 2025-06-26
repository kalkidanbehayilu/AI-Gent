import { BaseLLMProvider, LLMProviderConfig, LLMRequestOptions } from './base';
import { LLMProvider, LLMResponse, Message } from '../types';
import { LLMError } from '../types';
import axios from 'axios';

export class ClaudeProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(config: LLMProviderConfig) {
    super(config, LLMProvider.CLAUDE);
    this.validateConfig();
    this.apiKey = this.config.apiKey;
    this.baseURL = this.config.baseURL || 'https://api.anthropic.com';
  }

  async generateResponse(options: LLMRequestOptions): Promise<LLMResponse> {
    try {
      const messages = this.formatMessagesForClaude(options.messages);
      
      const requestBody = {
        model: options.model,
        messages,
        max_tokens: options.maxTokens ?? 1000,
        temperature: options.temperature ?? 0.7,
      };

      const response = await axios.post(
        `${this.baseURL}/v1/messages`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: this.config.timeout ? this.config.timeout * 1000 : 30000
        }
      );

      const content = response.data.content[0];

      if (!content || content.type !== 'text') {
        throw new LLMError('No text response received from Claude', LLMProvider.CLAUDE);
      }

      const result: LLMResponse = {
        content: content.text,
      };

      // Add usage if available
      if (response.data.usage) {
        result.usage = {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
        };
      }

      return result;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown Claude error';
      throw new LLMError(errorMessage, LLMProvider.CLAUDE);
    }
  }

  private formatMessagesForClaude(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));
  }
} 