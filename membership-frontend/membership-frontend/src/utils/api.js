// API configuration and utility functions
// In production (built into Flask), VITE_API_URL is '' so all paths are relative.
// In development, VITE_API_URL is undefined so ?? returns '' and the Vite proxy
// forwards /api/* to http://localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

// Test API connection
export const testApiConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Only log actual errors, not network unavailability
    if (error.name !== 'AbortError' && !error.message.includes('Failed to fetch')) {
      console.warn('API connection test failed:', error.message);
    }
    return false;
  }
};

// API request wrapper with error handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 401) {
        window.location.href = import.meta.env.BASE_URL + 'login';
        return null;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export { API_BASE_URL };
