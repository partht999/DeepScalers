import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FiSend, FiPaperclip, FiMic, FiChevronDown, FiCommand, FiZap, FiRefreshCw, FiThumbsUp, FiThumbsDown } from 'react-icons/fi'
import ChatBubble, { MessageType } from '../components/ChatBubble'

// Add these animation styles to your tailwind.css or append to a style tag
const VoiceAnimations = () => (
  <style>
    {`
     @keyframes ping-slow {
       0% {
         transform: scale(0.2);
         opacity: 0.8;
       }
       80%, 100% {
         transform: scale(2);
         opacity: 0;
       }
     }
     .animate-ping-slow {
       animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
     }
     @keyframes fadeIn {
       from { opacity: 0; }
       to { opacity: 1; }
     }
     .animate-fadeIn {
       animation: fadeIn 0.3s ease-in;
     }
     @keyframes glow {
       0% {
         box-shadow: 0 0 5px rgba(20, 184, 166, 0.3);
       }
       50% {
         box-shadow: 0 0 20px rgba(20, 184, 166, 0.6);
       }
       100% {
         box-shadow: 0 0 5px rgba(20, 184, 166, 0.3);
       }
     }
     .ring-teal-500\/20 {
       box-shadow: 0 0 10px rgba(20, 184, 166, 0.3);
       animation: glow 2s ease-in-out infinite;
     }
    `}
  </style>
);

// Define VoiceRecognitionClient interface
interface VoiceRecognitionResult {
  text: string;
  confidence?: number;
  isFinal?: boolean;
}

interface VoiceRecognitionClient {
  apiBaseUrl: string;
  isListening: boolean;
  selectedMicrophoneIndex: number | null;
  setRecognitionResultCallback: (callback: (result: VoiceRecognitionResult) => void) => void;
  setErrorCallback: (callback: (error: string) => void) => void;
  setStatusCallback: (callback: (status: string) => void) => void;
  startRecognition: () => Promise<VoiceRecognitionResult | null>;
  getMicrophones: () => Promise<any[]>;
  setMicrophone: (index: number) => void;
  stopRecognition: () => void;
}

// Extend Window interface
declare global {
  interface Window {
    VoiceRecognitionClient?: new (apiBaseUrl?: string) => VoiceRecognitionClient;
    voiceClient?: VoiceRecognitionClient;
  }
}

// Initial welcome message
const welcomeMessage: MessageType = {
  id: '1',
  text: 'Hello! How can I help you with your studies today?',
  sender: 'ai',
  timestamp: new Date(Date.now() - 60000 * 5),
}

// Subject options for dropdown
const subjects = [
  'All Subjects',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
]

interface LocationState {
  initialQuery?: string;
}

const ChatPage = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const initialQuery = state?.initialQuery || '';
  
  const [messages, setMessages] = useState<MessageType[]>([welcomeMessage])
  const [newMessage, setNewMessage] = useState(initialQuery)
  const [subject, setSubject] = useState(subjects[0])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showError, setShowError] = useState<string | null>(null);
  const [showTranscriptionSuccess, setShowTranscriptionSuccess] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [isListening, setIsListening] = useState(false)
  const [voiceClient, setVoiceClient] = useState<VoiceRecognitionClient | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Initialize the voice client from the global instance
  useEffect(() => {
    console.log("Initializing voice recognition client...");
    console.log("window.voiceClient exists:", !!window.voiceClient);
    console.log("window.VoiceRecognitionClient exists:", !!window.VoiceRecognitionClient);
    
    if (window.voiceClient) {
      try {
        // Use the existing global instance
        const client = window.voiceClient;
        
        // Set up event handlers
        client.setRecognitionResultCallback((result) => {
          console.log("Voice recognition result:", result);
          if (result && result.text) {
            setNewMessage(result.text);
            setLastTranscript(result.text);
            setShowTranscriptionSuccess(true);
            setTimeout(() => setShowTranscriptionSuccess(false), 3000);
          }
        });
        
        client.setErrorCallback((error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
          setShowError(error);
          setTimeout(() => setShowError(null), 5000);
        });
        
        client.setStatusCallback((status) => {
          console.log('Voice recognition status:', status);
          if (status === 'Recognition complete' || status === 'Recognition stopped by user') {
            setIsListening(false);
          }
        });
        
        // Store client
        setVoiceClient(client);
        console.log("Voice client ready");
      } catch (error) {
        console.error("Error initializing voice client:", error);
        setShowError("Failed to initialize voice recognition");
      }
    } else if (window.VoiceRecognitionClient) {
      try {
        // Create a new instance with our API base URL
        const client = new window.VoiceRecognitionClient('/api/voice-recognition');
        
        // Set up event handlers
        client.setRecognitionResultCallback((result) => {
          console.log("Voice recognition result:", result);
          if (result && result.text) {
            setNewMessage(result.text);
            setLastTranscript(result.text);
      setShowTranscriptionSuccess(true);
            setTimeout(() => setShowTranscriptionSuccess(false), 3000);
          }
        });
        
        client.setErrorCallback((error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
      setShowError(error);
          setTimeout(() => setShowError(null), 5000);
        });
        
        client.setStatusCallback((status) => {
          console.log('Voice recognition status:', status);
          if (status === 'Recognition complete' || status === 'Recognition stopped by user') {
            setIsListening(false);
          }
        });
        
        // Store client
        setVoiceClient(client);
        console.log("Voice client ready (created new instance)");
      } catch (error) {
        console.error("Error initializing voice client:", error);
        setShowError("Failed to initialize voice recognition");
      }
    } else {
      console.error("Voice recognition client not found in window object");
      console.log("Window object properties:", Object.keys(window));
      setShowError("Voice recognition not available - client not loaded");
    }
  }, []);
  
  // Voice recognition handler
  const handleVoiceRecognition = async () => {
    if (!voiceClient) {
      setShowError("Voice recognition not available");
      return;
    }
    
    if (isListening) {
      voiceClient.stopRecognition();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        await voiceClient.startRecognition();
      } catch (error) {
        setIsListening(false);
        setShowError(error instanceof Error ? error.message : String(error));
      }
    }
  };
  
  // Animate in after component mounts
  useEffect(() => {
    setAnimateIn(true);
  }, []);
  
  // Submit initial query if provided
  useEffect(() => {
    if (initialQuery) {
      handleSendMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      // Wait for any animations to complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);
  
  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [newMessage])
  
  // Add keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus on input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Mock sending a message and getting AI response
  const handleSendMessage = () => {
    if (!newMessage.trim() || isLoading) return
    
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
    }
    
    setMessages([...messages, userMessage])
    const currentMessage = newMessage;
    setNewMessage('')
    setIsLoading(true)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    // Simulate AI response after delay
    setTimeout(() => {
      const aiResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(currentMessage, subject),
        sender: 'ai',
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }
  
  // Regenerate last AI response
  const handleRegenerate = () => {
    if (isLoading || regenerating) return;
    
    setRegenerating(true);
    
    // Find last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.sender === 'user');
    if (lastUserMessageIndex === -1) {
      setRegenerating(false);
      return;
    }
    
    const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
    
    // Remove the last AI response
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);
    
    // Show loading indicator
    setIsLoading(true);
    
    // Generate new response
    setTimeout(() => {
      const aiResponse: MessageType = {
        id: Date.now().toString(),
        text: generateResponse(lastUserMessage.text, subject),
        sender: 'ai',
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      setRegenerating(false);
    }, 1500);
  };
  
  // Generate a more detailed mock response based on the query
  const generateResponse = (query: string, subject: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('quantum') || lowerQuery.includes('physics')) {
      return `
In quantum mechanics, particles can exist in multiple states simultaneously (superposition) until observed. This is fundamentally different from classical physics, where objects have definite properties.

The famous Schrödinger's cat thought experiment illustrates this: a cat in a box with a radioactive atom is simultaneously alive and dead until observed.

Key quantum concepts include:
- Wave-particle duality
- Heisenberg's uncertainty principle
- Quantum entanglement
- Quantum tunneling

These principles form the foundation of technologies like quantum computing, which uses quantum bits or "qubits" that can represent multiple states at once, potentially solving problems impossible for classical computers.
      `.trim();
    }
    
    if (lowerQuery.includes('equation') || lowerQuery.includes('quadratic')) {
      return `
To solve a quadratic equation in the form ax² + bx + c = 0:

1. Use the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a

2. Step by step:
   - Calculate the discriminant: b² - 4ac
   - If the discriminant is negative, there are no real solutions
   - If the discriminant is zero, there is one real solution: x = -b / 2a
   - If the discriminant is positive, there are two real solutions

3. Example: For 2x² - 4x - 6 = 0
   a = 2, b = -4, c = -6
   Discriminant = (-4)² - 4(2)(-6) = 16 + 48 = 64
   x = (4 ± √64) / 4 = (4 ± 8) / 4
   x = 3 or x = -1

Would you like to see another example?
      `.trim();
    }
    
    if (lowerQuery.includes('mitosis') || lowerQuery.includes('meiosis')) {
      return `
Mitosis and meiosis are both types of cell division, but they serve different purposes:

**Mitosis:**
- Creates two identical daughter cells
- Maintains the same chromosome number (diploid to diploid)
- Used for growth, repair, and asexual reproduction
- Consists of one division cycle
- Results in 2 genetically identical cells

**Meiosis:**
- Creates four haploid daughter cells
- Reduces chromosome number by half (diploid to haploid)
- Used for sexual reproduction (creating gametes)
- Consists of two division cycles (meiosis I and II)
- Results in 4 genetically diverse cells
- Involves crossing over and genetic recombination

The key difference is that mitosis maintains genetic continuity, while meiosis introduces genetic variation, which is essential for evolution and adaptation.
      `.trim();
    }
    
    // Default response
    return `I understand your question about "${query}". Here's what I know about this topic in ${subject !== 'All Subjects' ? subject : 'general'}:

This is an important concept in ${subject !== 'All Subjects' ? subject : 'academics'}. The key points to understand are:

1. The fundamental principles involve understanding the underlying concepts
2. There are several approaches to solve problems in this area
3. Many students find this topic challenging initially, but with practice it becomes clearer

Would you like me to explain any specific aspect of this topic in more detail?`;
  }
  
  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Toggle subject dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  // Handle subject selection
  const handleSubjectChange = (selectedSubject: string) => {
    setSubject(selectedSubject)
    setShowDropdown(false)
  }

  // Handle feedback clicks (thumbs up/down)
  const handleFeedback = (isPositive: boolean) => {
    // In a real app, you would send this feedback to your backend
    alert(`Thank you for your ${isPositive ? 'positive' : 'negative'} feedback!`);
  };

  // Display text with highlight on last transcription
  const displayMessageWithHighlight = () => {
    if (!lastTranscript || !showTranscriptionSuccess) {
      return newMessage;
    }
    
    // Find the position of the last transcript in the message
    const lastIndex = newMessage.lastIndexOf(lastTranscript);
    
    if (lastIndex === -1) {
      return newMessage;
    }
    
    // Split the message into parts
    const beforeTranscript = newMessage.substring(0, lastIndex);
    const afterTranscript = newMessage.substring(lastIndex + lastTranscript.length);
    
    // Return the message with the last transcript highlighted
    return (
      <>
        {beforeTranscript}
        <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-1 rounded">
          {lastTranscript}
        </span>
        {afterTranscript}
      </>
    );
  };

  return (
    <div 
      className="flex flex-col h-full"
      ref={chatContainerRef}
    >
      {/* Include voice animations */}
      <VoiceAnimations />
      
      {/* Messages Container */}
      <div 
        className={`flex-1 overflow-y-auto pb-32 transition-opacity duration-500 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Subject Selector positioned at top */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black py-2 px-4 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
          <div className="relative max-w-xs">
            <button 
              onClick={toggleDropdown}
              className="flex items-center justify-between w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <span>{subject}</span>
              <FiChevronDown className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute mt-1 w-full z-20 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg animate-fadeIn">
                <ul className="py-1 max-h-56 overflow-y-auto">
                  {subjects.map((sub) => (
                    <li 
                      key={sub} 
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 ${
                        subject === sub ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => handleSubjectChange(sub)}
                    >
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Welcome message */}
        {messages.length === 1 && (
          <div className="flex justify-center items-center py-10 px-4 animate-fadeIn">
            <div className="text-center max-w-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Welcome to Student AI</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ask any academic question and get instant, intelligent answers to help with your studies.
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <FiCommand className="mr-1" size={14} />
                <span>Press </span>
                <kbd className="mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-sans text-xs">Ctrl/⌘</kbd>
                <span>+</span>
                <kbd className="mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-sans text-xs">K</kbd>
                <span> to focus on the input</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat messages with alternating backgrounds */}
        <div className="w-full max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`py-6 ${message.sender === 'ai' ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-900'}`}
              style={{
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
                animation: 'fadeSlideUp 0.3s ease forwards'
              }}
            >
              <div className="max-w-3xl mx-auto px-4">
                <ChatBubble message={message} />
                
                {/* Show feedback buttons only for AI responses and not the initial welcome message */}
                {message.sender === 'ai' && index > 0 && (
                  <div className="flex items-center mt-2 ml-12 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleFeedback(true)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                      aria-label="Thumbs up"
                    >
                      <FiThumbsUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(false)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                      aria-label="Thumbs down"
                    >
                      <FiThumbsDown size={14} />
                    </button>
                    
                    {/* Regenerate button - only show for the last AI message */}
                    {index === messages.length - 1 && message.sender === 'ai' && (
                      <button 
                        onClick={handleRegenerate}
                        disabled={regenerating || isLoading}
                        className="flex items-center ml-2 p-1 px-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-all duration-200"
                        aria-label="Regenerate response"
                      >
                        <FiRefreshCw className={`mr-1 ${regenerating ? 'animate-spin' : ''}`} size={12} />
                        Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="py-6 bg-white dark:bg-black animate-fadeIn">
              <div className="max-w-3xl mx-auto px-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white pulse-animation">
                      <div className="w-5 h-5 rounded-full bg-teal-400 animate-ping absolute"></div>
                      AI
                    </div>
                  </div>
                  <div className="flex space-x-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible element for auto-scrolling */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
      
      {/* Show error messages */}
      {showError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50 shadow-md">
          {showError}
        </div>
      )}
      
      {/* Input Area - Fixed at bottom with glass effect */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 transition-all duration-300">
        <div className="max-w-3xl mx-auto">
          <div className={`relative flex items-end ${
            isInputFocused 
              ? 'bg-white dark:bg-gray-950 shadow-lg ring-4 ring-teal-500/20 border-teal-500 dark:border-teal-500 transform scale-[1.02]' 
              : 'bg-gray-100 dark:bg-gray-900 border-transparent'
            } rounded-lg p-2 pr-3 border-2 transition-all duration-300`}>
            {/* Attachment button */}
            <button 
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200 mr-1"
              aria-label="Attach file"
            >
              <FiPaperclip />
            </button>
            
            {/* Voice recognition button */}
            <button 
              onClick={handleVoiceRecognition}
              className={`relative p-2 rounded-full transition-all duration-300 mr-1 ${
                isListening 
                  ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400 transform scale-110' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice recognition"}
            >
              <FiMic className={isListening ? 'relative z-10' : ''} />
              {isListening && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="absolute w-10 h-10 rounded-full bg-primary-500 opacity-20 animate-ping-slow"></span>
                  <span className="absolute w-7 h-7 rounded-full bg-primary-400 opacity-40 animate-ping" style={{ animationDelay: '0.5s' }}></span>
                </span>
              )}
            </button>
            
            {/* Message input */}
            {newMessage && showTranscriptionSuccess ? (
              <div 
                className="flex-1 outline-none bg-transparent py-2 px-2 max-h-32 overflow-y-auto"
                onClick={() => textareaRef.current?.focus()}
              >
                {displayMessageWithHighlight()}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Type your message or use voice recognition..."
                className="flex-1 outline-none bg-transparent resize-none max-h-32 py-2 px-2"
                rows={1}
              />
            )}
            
            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              title="Send message"
              className={`p-2 rounded-lg transition-all duration-200 ${
                newMessage.trim() && !isLoading
                  ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FiSend size={18} className={newMessage.trim() && !isLoading ? 'hover:animate-pulse' : ''} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcut indicator */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center opacity-50 pointer-events-none">
        <div className="bg-white dark:bg-gray-900 text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 flex items-center">
          <FiCommand className="mr-1" size={12} />
          <span>Press </span>
          <kbd className="mx-1 px-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 text-xs">Ctrl/⌘</kbd>
          <span>+</span>
          <kbd className="mx-1 px-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 text-xs">K</kbd>
          <span> to focus on the input</span>
        </div>
      </div>
      
      {/* Voice recognition status indicator */}
      {isListening && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-primary-50 dark:bg-primary-900 
                        text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full text-xs 
                        border border-primary-200 dark:border-primary-800 shadow-md animate-fadeIn flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse mr-2"></span>
          <span>Listening...</span>
        </div>
      )}
      
      {/* Transcription success toast */}
      {showTranscriptionSuccess && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-green-50 dark:bg-green-900 
                        text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm 
                        border border-green-200 dark:border-green-800 shadow-md animate-fadeIn z-50 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Transcription complete</span>
        </div>
      )}
    </div>
  )
}

export default ChatPage 