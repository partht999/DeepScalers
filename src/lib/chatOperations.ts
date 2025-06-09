import axios from 'axios';
import { API_CONFIG } from '../config';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface MessageType {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

// Generate a unique ID for messages
const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Process a message and get AI response
export const processMessage = async (message: string): Promise<MessageType> => {
  try {
    const response = await fetch(`${API_BASE_URL}/faq/ask/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if the response is a stream
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let accumulatedResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;
      }

      return {
        id: Date.now().toString(),
        text: accumulatedResponse,
        sender: 'ai',
        timestamp: new Date()
      };
    } else {
      // Handle regular JSON response
      const data = await response.json();
      return {
        id: Date.now().toString(),
        text: data.answer,
        sender: 'ai',
        timestamp: new Date()
      };
    }
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
};

// Generate a mock response for testing
const generateMockResponse = (query: string, subject: string): string => {
  const responses = [
    `I understand you're asking about ${query}. Let me help you with that.`,
    `That's an interesting question about ${subject}. Here's what I know...`,
    `Regarding ${query}, I can provide some insights...`,
    `Let me explain ${query} in the context of ${subject}...`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Create a user message
export const createUserMessage = (text: string): MessageType => ({
  id: generateUniqueId(),
  text,
  sender: 'user',
  timestamp: new Date(),
});

// Create an AI message
export const createAIMessage = (text: string): MessageType => ({
  id: generateUniqueId(),
  text,
  sender: 'ai',
  timestamp: new Date(),
}); 