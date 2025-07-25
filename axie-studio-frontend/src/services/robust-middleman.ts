// Robust Middleman Framework for Axie Studio
// This service provides enhanced API proxying, error handling, and monitoring

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_PROXY_CONFIG, getBackendUrl, addProxyHeaders } from '../config/api-proxy';

interface MiddlemanConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

interface RequestMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

interface HealthStatus {
  frontend: 'healthy' | 'degraded' | 'down';
  backend: 'healthy' | 'degraded' | 'down';
  proxy: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
}

export class RobustMiddlemanService {
  private axiosInstance: AxiosInstance;
  private config: MiddlemanConfig;
  private metrics: RequestMetrics[] = [];
  private healthStatus: HealthStatus;
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

  constructor(config?: Partial<MiddlemanConfig>) {
    this.config = {
      baseURL: API_PROXY_CONFIG.langflowBackendUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: true,
      enableMetrics: true,
      ...config
    };

    this.healthStatus = {
      frontend: 'healthy',
      backend: 'healthy',
      proxy: 'healthy',
      lastCheck: Date.now()
    };

    this.initializeAxiosInstance();
    this.startHealthMonitoring();
  }

  private initializeAxiosInstance(): void {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...addProxyHeaders()
      }
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.circuitBreakerState === 'open') {
          throw new Error('Circuit breaker is open - service temporarily unavailable');
        }

        // Add authentication headers if available
        const token = localStorage.getItem('axie-studio-auth');
        if (token) {
          try {
            const { user } = JSON.parse(token);
            if (user?.access_token) {
              config.headers.Authorization = `Bearer ${user.access_token}`;
            }
          } catch (error) {
            console.warn('Failed to parse auth token:', error);
          }
        }

        // Log request if enabled
        if (this.config.enableLogging) {
          console.log(`[Middleman] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        this.logError('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.recordSuccess();
        this.recordMetrics(response);
        return response;
      },
      async (error) => {
        this.recordFailure();
        this.recordMetrics(error.response, false);
        
        // Retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error.config);
        }

        return Promise.reject(this.enhanceError(error));
      }
    );
  }

  private shouldRetry(error: any): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;
    const retryCount = error.config?._retryCount || 0;
    
    return (
      retryCount < this.config.retryAttempts &&
      (retryableStatuses.includes(status) || error.code === 'ECONNABORTED')
    );
  }

  private async retryRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const retryCount = (config._retryCount || 0) + 1;
    const delay = this.config.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff

    await new Promise(resolve => setTimeout(resolve, delay));

    config._retryCount = retryCount;
    
    if (this.config.enableLogging) {
      console.log(`[Middleman] Retrying request (attempt ${retryCount}/${this.config.retryAttempts})`);
    }

    return this.axiosInstance.request(config);
  }

  private recordSuccess(): void {
    if (this.circuitBreakerState === 'half-open') {
      this.circuitBreakerState = 'closed';
      this.failureCount = 0;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreakerState = 'open';
      setTimeout(() => {
        this.circuitBreakerState = 'half-open';
      }, this.CIRCUIT_BREAKER_TIMEOUT);
    }
  }

  private recordMetrics(response: AxiosResponse | undefined, success: boolean = true): void {
    if (!this.config.enableMetrics || !response?.config) return;

    const metric: RequestMetrics = {
      endpoint: response.config.url || 'unknown',
      method: response.config.method?.toUpperCase() || 'UNKNOWN',
      duration: Date.now() - (response.config.metadata?.startTime || Date.now()),
      status: response.status || 0,
      timestamp: Date.now(),
      success
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private enhanceError(error: any): Error {
    const enhancedError = new Error();
    enhancedError.name = 'MiddlemanError';
    enhancedError.message = this.getErrorMessage(error);
    
    // Add additional context
    (enhancedError as any).originalError = error;
    (enhancedError as any).timestamp = Date.now();
    (enhancedError as any).circuitBreakerState = this.circuitBreakerState;
    
    return enhancedError;
  }

  private getErrorMessage(error: any): string {
    if (error.response) {
      // Server responded with error status
      return `Backend error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
    } else if (error.request) {
      // Request was made but no response received
      return 'Backend is not responding. Please check your connection.';
    } else {
      // Something else happened
      return `Request failed: ${error.message}`;
    }
  }

  private logError(message: string, error: any): void {
    if (this.config.enableLogging) {
      console.error(`[Middleman] ${message}`, error);
    }
  }

  private async startHealthMonitoring(): Promise<void> {
    const checkHealth = async () => {
      try {
        // Check backend health
        const response = await axios.get(`${this.config.baseURL}/health`, { timeout: 5000 });
        this.healthStatus.backend = response.status === 200 ? 'healthy' : 'degraded';
      } catch (error) {
        this.healthStatus.backend = 'down';
      }

      // Check frontend health (always healthy if we're running)
      this.healthStatus.frontend = 'healthy';
      
      // Check proxy health based on recent metrics
      const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 60000);
      const successRate = recentMetrics.length > 0 
        ? recentMetrics.filter(m => m.success).length / recentMetrics.length 
        : 1;
      
      this.healthStatus.proxy = successRate > 0.9 ? 'healthy' : 
                               successRate > 0.5 ? 'degraded' : 'down';
      
      this.healthStatus.lastCheck = Date.now();
    };

    // Initial health check
    await checkHealth();

    // Schedule periodic health checks
    setInterval(checkHealth, 30000); // Every 30 seconds
  }

  // Public API methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get(getBackendUrl(url), config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post(getBackendUrl(url), data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put(getBackendUrl(url), data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete(getBackendUrl(url), config);
    return response.data;
  }

  public getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  public getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  public getCircuitBreakerState(): string {
    return this.circuitBreakerState;
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public resetCircuitBreaker(): void {
    this.circuitBreakerState = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// Singleton instance
export const robustMiddleman = new RobustMiddlemanService();
