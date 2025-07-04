import { z } from 'zod';

// LLM Provider types
export enum LLMProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  LLAMA = 'llama',
  CUSTOM = 'custom'
}

// Message schema
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string(),
  name: z.string().optional(),
  function_call: z.object({
    name: z.string(),
    arguments: z.string()
  }).optional()
});

export type Message = z.infer<typeof MessageSchema>;

// Agent configuration schema
export const AgentConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  systemPrompt: z.string(),
  provider: z.nativeEnum(LLMProvider),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().optional(),
  functions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.any())
  })).optional(),
  memory: z.object({
    enabled: z.boolean().default(true),
    maxMessages: z.number().positive().default(10)
  }).default({ enabled: true, maxMessages: 10 }),
  streaming: z.object({
    enabled: z.boolean().default(false),
    chunkSize: z.number().positive().default(50)
  }).default({ enabled: false, chunkSize: 50 })
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// LLM Response interface
export interface LLMResponse {
  content: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Streaming response interface
export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Real-time event types
export enum RealtimeEventType {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  STREAM_CHUNK = 'stream_chunk',
  STREAM_COMPLETE = 'stream_complete',
  FUNCTION_CALL = 'function_call',
  ERROR = 'error',
  AGENT_STATUS = 'agent_status'
}

export interface RealtimeEvent {
  type: RealtimeEventType;
  agentId: string;
  timestamp: number;
  data: any;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  agentId?: string;
  data: any;
}

// Agent interface
export interface Agent {
  config: AgentConfig;
  messages: Message[];
  sendMessage(content: string): Promise<LLMResponse>;
  sendMessageStream(content: string): AsyncGenerator<StreamingResponse>;
  addMessage(message: Message): void;
  clearMemory(): void;
  getMemory(): Message[];
}

// Real-time Agent interface
export interface RealtimeAgent extends Agent {
  id: string;
  emit(event: RealtimeEventType, data: any): void;
  on(event: RealtimeEventType, callback: (data: any) => void): void;
  off(event: RealtimeEventType, callback: (data: any) => void): void;
}

// Function definition interface
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (args: Record<string, any>) => Promise<any>;
}

// Tool interface
export interface Tool {
  name: string;
  description: string;
  execute: (args: Record<string, any>) => Promise<any>;
}

// Error types
export class AIGentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AIGentError';
  }
}

export class LLMError extends AIGentError {
  constructor(message: string, public provider: LLMProvider) {
    super(message, 'LLM_ERROR');
    this.name = 'LLMError';
  }
}

export class ConfigurationError extends AIGentError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class RealtimeError extends AIGentError {
  constructor(message: string) {
    super(message, 'REALTIME_ERROR');
    this.name = 'RealtimeError';
  }
} 