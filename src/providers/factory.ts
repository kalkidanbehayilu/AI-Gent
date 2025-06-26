import { LLMProvider } from '../types';
import { BaseLLMProvider, LLMProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { LlamaProvider } from './llama';
import { ConfigurationError } from '../types';

export class LLMProviderFactory {
  static createProvider(provider: LLMProvider, config: LLMProviderConfig): BaseLLMProvider {
    switch (provider) {
      case LLMProvider.OPENAI:
        return new OpenAIProvider(config);
      case LLMProvider.CLAUDE:
        return new ClaudeProvider(config);
      case LLMProvider.LLAMA:
        return new LlamaProvider(config);
      case LLMProvider.CUSTOM:
        throw new ConfigurationError('Custom provider not implemented yet');
      default:
        throw new ConfigurationError(`Unsupported provider: ${provider}`);
    }
  }

  static validateProviderConfig(provider: LLMProvider, config: LLMProviderConfig): void {
    switch (provider) {
      case LLMProvider.OPENAI:
        if (!config.apiKey) {
          throw new ConfigurationError('API key is required for OpenAI provider');
        }
        if (!config.apiKey.startsWith('sk-')) {
          throw new ConfigurationError('Invalid OpenAI API key format');
        }
        break;
      case LLMProvider.CLAUDE:
        if (!config.apiKey) {
          throw new ConfigurationError('API key is required for Claude provider');
        }
        if (!config.apiKey.startsWith('sk-ant-')) {
          throw new ConfigurationError('Invalid Claude API key format');
        }
        break;
      case LLMProvider.LLAMA:
        // LLaMA doesn't always require an API key (local instances)
        if (!config.baseURL && !config.apiKey) {
          throw new ConfigurationError('Either baseURL or apiKey is required for LLaMA provider');
        }
        break;
      case LLMProvider.CUSTOM:
        // Custom validation logic can be added here
        break;
    }
  }
} 