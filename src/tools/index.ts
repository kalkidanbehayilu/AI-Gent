import { Tool } from '../types';
import axios from 'axios';

// HTTP Request Tool
export const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make HTTP requests to external APIs or services',
  execute: async (args: Record<string, any>) => {
    try {
      const { method, url, headers = {}, body } = args;
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: body,
        timeout: 10000
      });
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        };
      }
      throw error;
    }
  }
};

// File System Tool (Basic)
export const fileSystemTool: Tool = {
  name: 'file_system',
  description: 'Read and write files (basic operations)',
  execute: async (args: Record<string, any>) => {
    const fs = require('fs').promises;
    const { operation, path, content } = args;

    try {
      switch (operation) {
        case 'read':
          const data = await fs.readFile(path, 'utf8');
          return { content: data };
        case 'write':
          await fs.writeFile(path, content || '', 'utf8');
          return { success: true, message: 'File written successfully' };
        case 'exists':
          try {
            await fs.access(path);
            return { exists: true };
          } catch {
            return { exists: false };
          }
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Calculator Tool
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  execute: async (args: Record<string, any>) => {
    try {
      const { expression } = args;
      // Basic safety check - only allow mathematical expressions
      const safeExpression = expression.replace(/[^0-9+\-*/()., ]/g, '');
      const result = eval(safeExpression);
      return { result, expression };
    } catch (error) {
      return { error: 'Invalid mathematical expression' };
    }
  }
};

// Date/Time Tool
export const dateTimeTool: Tool = {
  name: 'datetime',
  description: 'Get current date/time or format dates',
  execute: async (args: Record<string, any>) => {
    const { operation, format, date } = args;
    
    try {
      switch (operation) {
        case 'now':
          const now = new Date();
          return {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            formatted: format ? now.toLocaleString() : now.toString()
          };
        case 'format':
          if (!date) throw new Error('Date is required for format operation');
          const dateObj = new Date(date);
          return {
            timestamp: dateObj.getTime(),
            iso: dateObj.toISOString(),
            formatted: format ? dateObj.toLocaleString() : dateObj.toString()
          };
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Weather Tool (placeholder - would need actual API key)
export const weatherTool: Tool = {
  name: 'weather',
  description: 'Get weather information for a location',
  execute: async (args: Record<string, any>) => {
    const { location, apiKey } = args;
    if (!apiKey) {
      return { error: 'Weather API key is required' };
    }
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );
      return {
        location,
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed
      };
    } catch (error) {
      return { error: 'Failed to fetch weather data' };
    }
  }
};

// Export all tools
export const defaultTools = [
  httpRequestTool,
  fileSystemTool,
  calculatorTool,
  dateTimeTool,
  weatherTool
]; 