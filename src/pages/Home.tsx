import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSend, FiSearch, FiBookOpen, FiClock, FiUsers, FiArrowRight, FiCommand, FiZap } from 'react-icons/fi'

// Example queries for suggestions
const exampleQueries = [
  "Explain quantum computing in simple terms",
  "How do I solve quadratic equations?",
  "What's the difference between mitosis and meiosis?",
  "Explain Newton's laws of motion",
  "How does photosynthesis work?",
  "What is the theory of relativity?"
];

// Example capabilities to showcase
const capabilities = [
  {
    icon: FiSearch,
    title: "Research Assistant",
    description: "Find answers to complex academic questions instantly"
  },
  {
    icon: FiBookOpen,
    title: "Study Guide",
    description: "Get explanations on academic topics in simple language"
  },
  {
    icon: FiClock,
    title: "Deadline Management",
    description: "Track your assignments and exam schedules"
  },
  {
    icon: FiUsers,
    title: "Faculty Interaction",
    description: "Access verified answers from professors"
  }
];

const Home = () => {
  const [query, setQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [typing, setTyping] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-run the animation after component mounts
  useEffect(() => {
    setAnimateIn(true);
  }, []);

  // Handle query submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Go to chat page with the query
      navigate('/chat', { state: { initialQuery: query } });
    }
  };

  // Handle example query click
  const handleExampleClick = (example: string) => {
    setQuery('');
    setTyping(true);
    
    // Type the example letter by letter
    let i = 0;
    const interval = setInterval(() => {
      if (i <= example.length) {
        setQuery(example.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTyping(false);
      }
    }, 25); // typing speed
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, exampleQueries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestion !== -1) {
      e.preventDefault();
      handleExampleClick(exampleQueries[activeSuggestion]);
      setActiveSuggestion(-1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black animate-fadeIn">
      <div 
        className={`flex-1 flex flex-col items-center justify-center px-4 py-12 transform transition-all duration-700 ${
          animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        {/* Logo and Title */}
        <div className="mb-12 text-center transform transition-all duration-500" style={{ transitionDelay: '200ms' }}>
          <div className="inline-block w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg transform hover:rotate-3 hover:scale-110 transition-all duration-300">
            AI
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Student Assistant
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 text-lg">
            Your personal AI academic companion
          </p>
        </div>
        
        {/* Query Input */}
        <div 
          className={`w-full max-w-2xl transition-all duration-500 transform ${
            isInputFocused ? 'scale-105' : 'scale-100'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <form onSubmit={handleSubmit} className="relative" onKeyDown={handleKeyDown}>
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={20} className={isInputFocused ? 'text-primary-500' : ''} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsInputFocused(true);
                setActiveSuggestion(-1);
              }}
              onBlur={() => setIsInputFocused(false)}
              disabled={typing}
              placeholder="Ask me anything about your studies..."
              className="w-full p-5 pl-12 pr-14 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!query.trim() || typing}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                query.trim() && !typing
                  ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FiArrowRight size={20} />
            </button>
          </form>
          
          <div className="mt-2 flex items-center justify-between px-1">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <FiCommand className="mr-1" size={14} />
              <span>+ K to focus</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <FiZap className="inline-block mr-1" size={14} />
              <span>Powered by AI</span>
            </div>
          </div>
        </div>
        
        {/* Example Queries */}
        <div 
          className="mt-12 w-full max-w-3xl transform transition-all duration-500 delay-500"
          style={{ transitionDelay: '600ms' }}
        >
          <h2 className="text-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-5">
            Examples you can ask
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleQueries.map((example, index) => (
              <button 
                key={index}
                onClick={() => handleExampleClick(example)}
                onMouseEnter={() => setActiveSuggestion(index)}
                onMouseLeave={() => setActiveSuggestion(-1)}
                className={`p-4 text-left border border-gray-200 dark:border-gray-800 rounded-xl group hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 ${
                  activeSuggestion === index 
                    ? 'bg-primary-50 dark:bg-gray-800 border-primary-300 dark:border-primary-700 shadow-sm' 
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  "{example}"
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Capabilities */}
        <div 
          className="mt-16 w-full max-w-4xl transform transition-all duration-500"
          style={{ transitionDelay: '800ms' }}
        >
          <h2 className="text-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">Capabilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map((capability, index) => (
              <div 
                key={index} 
                className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-center hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 group"
                style={{ transitionDelay: `${900 + index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 group-hover:bg-primary-200 dark:group-hover:bg-gray-700 transition-all duration-300">
                  <capability.icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{capability.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Keyboard Shortcut Handler */}
      <KeyboardShortcut 
        keys={['Meta', 'k']} 
        callback={() => inputRef.current?.focus()} 
      />
      
      {/* Footer */}
      <footer className="w-full py-5 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
        <p className="max-w-3xl mx-auto px-4">
          Student AI Assistant © {new Date().getFullYear()} • 
          <span className="mx-2">·</span>
          Built for academic excellence
          <span className="mx-2">·</span>
          <span className="text-primary-500 dark:text-primary-400">Privacy-focused</span>
        </p>
      </footer>
    </div>
  )
}

// Keyboard Shortcut Handler Component
const KeyboardShortcut = ({ 
  keys, 
  callback 
}: { 
  keys: string[], 
  callback: () => void 
}) => {
  useEffect(() => {
    const pressed = new Set();

    const handleKeyDown = (e: KeyboardEvent) => {
      pressed.add(e.key);
      
      // Check if all required keys are pressed
      if (keys.every(key => 
        pressed.has(key) || 
        (key === 'Meta' && (pressed.has('Control') || pressed.has('Meta')))
      )) {
        e.preventDefault();
        callback();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      pressed.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keys, callback]);

  return null;
};

export default Home 