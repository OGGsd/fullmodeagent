// Enhanced API Service using Robust Middleman
// This service provides high-level API methods with built-in error handling and monitoring

import { robustMiddleman } from './robust-middleman';

export interface FlowData {
  id: string;
  name: string;
  description: string;
  data: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  template: any;
  description: string;
}

export interface UserSession {
  user_id: string;
  username: string;
  role: string;
  last_activity: string;
  flows_created: number;
  components_used: number;
}

export class EnhancedApiService {
  // Flow Management
  async getFlows(folderId?: string): Promise<FlowData[]> {
    try {
      const endpoint = folderId ? `/api/v1/flows?folder_id=${folderId}` : '/api/v1/flows';
      return await robustMiddleman.get<FlowData[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch flows:', error);
      throw new Error('Unable to load workflows. Please try again.');
    }
  }

  async getFlow(flowId: string): Promise<FlowData> {
    try {
      return await robustMiddleman.get<FlowData>(`/api/v1/flows/${flowId}`);
    } catch (error) {
      console.error('Failed to fetch flow:', error);
      throw new Error('Unable to load workflow. Please check if it exists.');
    }
  }

  async createFlow(flowData: Partial<FlowData>): Promise<FlowData> {
    try {
      return await robustMiddleman.post<FlowData>('/api/v1/flows', flowData);
    } catch (error) {
      console.error('Failed to create flow:', error);
      throw new Error('Unable to create workflow. Please try again.');
    }
  }

  async updateFlow(flowId: string, flowData: Partial<FlowData>): Promise<FlowData> {
    try {
      return await robustMiddleman.put<FlowData>(`/api/v1/flows/${flowId}`, flowData);
    } catch (error) {
      console.error('Failed to update flow:', error);
      throw new Error('Unable to save workflow. Please try again.');
    }
  }

  async deleteFlow(flowId: string): Promise<void> {
    try {
      await robustMiddleman.delete(`/api/v1/flows/${flowId}`);
    } catch (error) {
      console.error('Failed to delete flow:', error);
      throw new Error('Unable to delete workflow. Please try again.');
    }
  }

  async runFlow(flowId: string, inputs?: any): Promise<any> {
    try {
      return await robustMiddleman.post(`/api/v1/flows/${flowId}/run`, inputs);
    } catch (error) {
      console.error('Failed to run flow:', error);
      throw new Error('Unable to execute workflow. Please check your configuration.');
    }
  }

  // Component Management
  async getComponents(): Promise<ComponentData[]> {
    try {
      return await robustMiddleman.get<ComponentData[]>('/api/v1/components');
    } catch (error) {
      console.error('Failed to fetch components:', error);
      throw new Error('Unable to load components. Please try again.');
    }
  }

  async getComponent(componentId: string): Promise<ComponentData> {
    try {
      return await robustMiddleman.get<ComponentData>(`/api/v1/components/${componentId}`);
    } catch (error) {
      console.error('Failed to fetch component:', error);
      throw new Error('Unable to load component. Please check if it exists.');
    }
  }

  // User Management (Admin)
  async getUsers(): Promise<any[]> {
    try {
      return await robustMiddleman.get<any[]>('/api/v1/users');
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Unable to load users. Please try again.');
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      return await robustMiddleman.post('/api/v1/users', userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Unable to create user. Please check the provided information.');
    }
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    try {
      return await robustMiddleman.put(`/api/v1/users/${userId}`, userData);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Unable to update user. Please try again.');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await robustMiddleman.delete(`/api/v1/users/${userId}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error('Unable to delete user. Please try again.');
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<any> {
    try {
      return await robustMiddleman.post('/api/v1/login', 
        new URLSearchParams({ username, password }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async logout(): Promise<void> {
    try {
      await robustMiddleman.post('/api/v1/logout');
    } catch (error) {
      console.error('Logout failed:', error);
      // Don't throw error for logout - just log it
    }
  }

  async refreshToken(): Promise<any> {
    try {
      return await robustMiddleman.post('/api/v1/refresh');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Session expired. Please log in again.');
    }
  }

  // File Management
  async uploadFile(file: File, flowId?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (flowId) {
        formData.append('flow_id', flowId);
      }

      return await robustMiddleman.post('/api/v1/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('Unable to upload file. Please try again.');
    }
  }

  async getFiles(): Promise<any[]> {
    try {
      return await robustMiddleman.get<any[]>('/api/v1/files');
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw new Error('Unable to load files. Please try again.');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await robustMiddleman.delete(`/api/v1/files/${fileId}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Unable to delete file. Please try again.');
    }
  }

  // System Health & Monitoring
  async getSystemHealth(): Promise<any> {
    try {
      return await robustMiddleman.get('/api/v1/health');
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return { status: 'unknown', message: 'Unable to check system health' };
    }
  }

  async getSystemVersion(): Promise<any> {
    try {
      return await robustMiddleman.get('/api/v1/version');
    } catch (error) {
      console.error('Failed to fetch system version:', error);
      return { version: 'unknown' };
    }
  }

  // Store/Marketplace
  async getStoreComponents(): Promise<any[]> {
    try {
      return await robustMiddleman.get<any[]>('/api/v1/store/components');
    } catch (error) {
      console.error('Failed to fetch store components:', error);
      throw new Error('Unable to load store components. Please try again.');
    }
  }

  async installComponent(componentId: string): Promise<any> {
    try {
      return await robustMiddleman.post(`/api/v1/store/components/${componentId}/install`);
    } catch (error) {
      console.error('Failed to install component:', error);
      throw new Error('Unable to install component. Please try again.');
    }
  }

  // Variables Management
  async getGlobalVariables(): Promise<any[]> {
    try {
      return await robustMiddleman.get<any[]>('/api/v1/variables');
    } catch (error) {
      console.error('Failed to fetch variables:', error);
      throw new Error('Unable to load variables. Please try again.');
    }
  }

  async createVariable(variableData: any): Promise<any> {
    try {
      return await robustMiddleman.post('/api/v1/variables', variableData);
    } catch (error) {
      console.error('Failed to create variable:', error);
      throw new Error('Unable to create variable. Please try again.');
    }
  }

  async updateVariable(variableId: string, variableData: any): Promise<any> {
    try {
      return await robustMiddleman.put(`/api/v1/variables/${variableId}`, variableData);
    } catch (error) {
      console.error('Failed to update variable:', error);
      throw new Error('Unable to update variable. Please try again.');
    }
  }

  async deleteVariable(variableId: string): Promise<void> {
    try {
      await robustMiddleman.delete(`/api/v1/variables/${variableId}`);
    } catch (error) {
      console.error('Failed to delete variable:', error);
      throw new Error('Unable to delete variable. Please try again.');
    }
  }

  // Utility Methods
  getMiddlemanHealth() {
    return robustMiddleman.getHealthStatus();
  }

  getMiddlemanMetrics() {
    return robustMiddleman.getMetrics();
  }

  resetMiddlemanCircuitBreaker() {
    robustMiddleman.resetCircuitBreaker();
  }

  clearMiddlemanMetrics() {
    robustMiddleman.clearMetrics();
  }
}

// Singleton instance
export const enhancedApi = new EnhancedApiService();
