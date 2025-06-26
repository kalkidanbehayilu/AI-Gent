import OpenAI from 'openai';
import { BaseLLMProvider, LLMProviderConfig, LLMRequestOptions } from './base';
import { LLMProvider, LLMResponse, Message } from '../types';
import { LLMError } from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: LLMProviderConfig) {
    super(config, LLMProvider.OPENAI);
    this.validateConfig();
    
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout ? this.config.timeout * 1000 : undefined,
    });
  }

  async generateResponse(options: LLMRequestOptions): Promise<LLMResponse> {
    try {
      const messages = this.formatMessages(options.messages);
      
      const requestOptions: any = {
        model: options.model,
        messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens && { max_tokens: options.maxTokens }),
        ...(options.functions && { functions: options.functions }),
        function_call: options.functions ? 'auto' : undefined,
      };

      const response = await this.client.chat.completions.create(requestOptions);
      const choice = response.choices[0];

      if (!choice) {
        throw new LLMError('No response received from OpenAI', LLMProvider.OPENAI);
      }

      const result: LLMResponse = {
        content: choice.message.content || '',
      };

      // Add usage if available
      if (response.usage) {
        result.usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      // Handle function calls
      if (choice.message.function_call) {
        result.functionCall = {
          name: choice.message.function_call.name,
          arguments: JSON.parse(choice.message.function_call.arguments),
        };
      }

      return result;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown OpenAI error';
      throw new LLMError(errorMessage, LLMProvider.OPENAI);
    }
  }
} 