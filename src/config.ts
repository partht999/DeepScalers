// Configuration constants for the application

// API URL configuration with environment fallbacks
export const API_CONFIG = {
  // Use environment variable if available, otherwise determine based on hostname
  BASE_URL: import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' 
      ? 'http://localhost:8000/api' 
      : 'https://deepscalers.onrender.com/api'), // Correct Render backend URL
  
  // Path constants
  AUTH: {
    SEND_VERIFICATION: '/auth/send-verification/',
    VERIFY_CODE: '/auth/verify-code/',
    PROFILE: '/auth/profile/',
    REGISTER: '/auth/register/',
    TOKEN: '/auth/token/',
    TOKEN_REFRESH: '/auth/token/refresh/',
  },
};

// Test connectivity to backend
export async function testBackendConnection() {
  const startTime = Date.now();
  try {
    console.log(`Testing backend connection to: ${API_CONFIG.BASE_URL}`);
    
    // Try to connect to a specific endpoint
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.SEND_VERIFICATION}`, {
      method: 'OPTIONS',
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`Backend connection test completed in ${elapsed}ms`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('Backend connection successful!');
      return { success: true, status: response.status, time: elapsed };
    } else {
      console.error('Backend connection failed with status:', response.status);
      return { success: false, status: response.status, time: elapsed };
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('Backend connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      time: elapsed 
    };
  }
}

// Other application configuration
export const APP_CONFIG = {
  // Default timeout for API requests (in milliseconds)
  DEFAULT_TIMEOUT: 15000,
  
  // Frontend routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
  },
}; 