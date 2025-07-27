// API Proxy Configuration for Axie Studio -> Backend
export interface ApiProxyConfig {
  langflowBackendUrl: string;
  enableProxy: boolean;
  proxyHeaders: Record<string, string>;
}

// Get the backend URL from environment or default
const getLangflowBackendUrl = (): string => {
  // Check for Vite environment variables first
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Check for environment variable first
  if (process.env.LANGFLOW_BACKEND_URL) {
    return process.env.LANGFLOW_BACKEND_URL;
  }

  // Check for legacy BACKEND_URL
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // Default to our backend instance
  return "https://langflow-tv34o.ondigitalocean.app";
};

export const API_PROXY_CONFIG: ApiProxyConfig = {
  langflowBackendUrl: getLangflowBackendUrl(),
  enableProxy: true,
  proxyHeaders: {
    'X-Forwarded-For': 'axie-studio',
    'X-Original-Host': 'axie-studio',
    'User-Agent': 'Axie-Studio-Frontend/1.0.0'
  }
};

// API endpoint mappings - maps Axie Studio frontend calls to backend endpoints
export const API_ENDPOINT_MAPPINGS = {
  // Authentication endpoints
  '/api/v1/login': '/api/v1/login',
  '/api/v1/logout': '/api/v1/logout',
  '/api/v1/refresh': '/api/v1/refresh',
  '/api/v1/auto_login': '/api/v1/auto_login',
  
  // User management
  '/api/v1/users': '/api/v1/users',
  
  // Flows and components
  '/api/v1/flows': '/api/v1/flows',
  '/api/v1/components': '/api/v1/components',
  '/api/v1/build': '/api/v1/build',
  '/api/v1/validate': '/api/v1/validate',
  
  // File management
  '/api/v1/files': '/api/v1/files',
  
  // Variables and configuration
  '/api/v1/variables': '/api/v1/variables',
  '/api/v1/config': '/api/v1/config',
  
  // Store and marketplace
  '/api/v1/store': '/api/v1/store',
  
  // Monitoring
  '/api/v1/monitor': '/api/v1/monitor',
  
  // Health check
  '/api/v1/health': '/api/v1/health',
  
  // API keys
  '/api/v1/api_key': '/api/v1/api_key',
  
  // Projects and folders
  '/api/v1/projects': '/api/v1/projects',
  
  // MCP (Model Context Protocol)
  '/api/v1/mcp': '/api/v1/mcp',
  
  // Voice
  '/api/v1/voice': '/api/v1/voice',
  
  // Version
  '/api/v1/version': '/api/v1/version'
};

// Helper function to get the full backend URL for an endpoint
export const getBackendUrl = (endpoint: string): string => {
  const mappedEndpoint = API_ENDPOINT_MAPPINGS[endpoint] || endpoint;
  return `${API_PROXY_CONFIG.langflowBackendUrl}${mappedEndpoint}`;
};

// Helper function to add proxy headers to requests
export const addProxyHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  if (!API_PROXY_CONFIG.enableProxy) {
    return headers;
  }
  
  return {
    ...headers,
    ...API_PROXY_CONFIG.proxyHeaders
  };
};
