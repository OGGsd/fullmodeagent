// Integrated API Service - Replaces the old axios-based API with our robust middleman
// This ensures all API calls go through our monitoring and circuit breaker system

import { robustMiddleman } from './robust-middleman';
import { backendUserManager } from './backend-user-management';

// Re-export the robust middleman as the main API
export const api = robustMiddleman;

// Enhanced API methods that integrate with our user management
export class IntegratedApiService {
  
  // Authentication methods
  async login(username: string, password: string) {
    return await backendUserManager.authenticateUser(username, password);
  }

  async logout() {
    try {
      await robustMiddleman.post('/api/v1/logout');
    } catch (error) {
      // Don't throw on logout errors, just log them
      console.warn('Logout error:', error);
    }
  }

  async refreshToken() {
    return await robustMiddleman.post('/api/v1/refresh');
  }

  async getCurrentUser() {
    return await backendUserManager.getCurrentUser();
  }

  // User management (admin only)
  async createUser(userData: { username: string; password: string; is_superuser?: boolean }) {
    return await backendUserManager.createUser(userData);
  }

  async getUsers() {
    return await backendUserManager.getUsers();
  }

  async updateUser(userId: string, updates: any) {
    return await backendUserManager.updateUser(userId, updates);
  }

  async deleteUser(userId: string) {
    return await backendUserManager.deleteUser(userId);
  }

  // Flow management (user-isolated)
  async getFlows(folderId?: string) {
    const endpoint = folderId ? `/api/v1/flows?folder_id=${folderId}` : '/api/v1/flows';
    return await robustMiddleman.get(endpoint);
  }

  async getFlow(flowId: string) {
    return await robustMiddleman.get(`/api/v1/flows/${flowId}`);
  }

  async createFlow(flowData: any) {
    return await robustMiddleman.post('/api/v1/flows', flowData);
  }

  async updateFlow(flowId: string, flowData: any) {
    return await robustMiddleman.put(`/api/v1/flows/${flowId}`, flowData);
  }

  async deleteFlow(flowId: string) {
    return await robustMiddleman.delete(`/api/v1/flows/${flowId}`);
  }

  async runFlow(flowId: string, inputs?: any) {
    return await robustMiddleman.post(`/api/v1/flows/${flowId}/run`, inputs);
  }

  // Component management
  async getComponents() {
    return await robustMiddleman.get('/api/v1/components');
  }

  async getComponent(componentId: string) {
    return await robustMiddleman.get(`/api/v1/components/${componentId}`);
  }

  // File management (user-isolated)
  async uploadFile(file: File, flowId?: string) {
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
  }

  async getFiles() {
    return await robustMiddleman.get('/api/v1/files');
  }

  async deleteFile(fileId: string) {
    return await robustMiddleman.delete(`/api/v1/files/${fileId}`);
  }

  // Variables management (user-isolated)
  async getVariables() {
    return await robustMiddleman.get('/api/v1/variables');
  }

  async createVariable(variableData: any) {
    return await robustMiddleman.post('/api/v1/variables', variableData);
  }

  async updateVariable(variableId: string, variableData: any) {
    return await robustMiddleman.put(`/api/v1/variables/${variableId}`, variableData);
  }

  async deleteVariable(variableId: string) {
    return await robustMiddleman.delete(`/api/v1/variables/${variableId}`);
  }

  // Folder management (user-isolated)
  async getFolders() {
    return await robustMiddleman.get('/api/v1/folders');
  }

  async createFolder(folderData: any) {
    return await robustMiddleman.post('/api/v1/folders', folderData);
  }

  async updateFolder(folderId: string, folderData: any) {
    return await robustMiddleman.put(`/api/v1/folders/${folderId}`, folderData);
  }

  async deleteFolder(folderId: string) {
    return await robustMiddleman.delete(`/api/v1/folders/${folderId}`);
  }

  // Build and validation
  async buildFlow(flowId: string, inputs?: any) {
    return await robustMiddleman.post(`/api/v1/build/${flowId}`, inputs);
  }

  async validateFlow(flowData: any) {
    return await robustMiddleman.post('/api/v1/validate', flowData);
  }

  // Store/Marketplace
  async getStoreComponents() {
    return await robustMiddleman.get('/api/v1/store/components');
  }

  async installComponent(componentId: string) {
    return await robustMiddleman.post(`/api/v1/store/components/${componentId}/install`);
  }

  // API Keys (user-isolated)
  async getApiKeys() {
    return await robustMiddleman.get('/api/v1/api_key');
  }

  async createApiKey(keyData: any) {
    return await robustMiddleman.post('/api/v1/api_key', keyData);
  }

  async deleteApiKey(keyId: string) {
    return await robustMiddleman.delete(`/api/v1/api_key/${keyId}`);
  }

  // System monitoring
  async getHealth() {
    return await robustMiddleman.get('/api/v1/health');
  }

  async getVersion() {
    return await robustMiddleman.get('/api/v1/version');
  }

  async getConfig() {
    return await robustMiddleman.get('/api/v1/config');
  }

  // User workspace verification (admin function)
  async verifyUserIsolation(userId1: string, userId2: string) {
    return await backendUserManager.verifyUserIsolation(userId1, userId2);
  }

  async getUserStats(userId: string) {
    return await backendUserManager.getUserStats(userId);
  }

  // White-label customization (user function - only if admin enabled)
  async getTenantCustomization(tenantId: string) {
    return await robustMiddleman.get(`/api/v1/tenants/${tenantId}/customization`);
  }

  async updateTenantCustomization(tenantId: string, customization: any) {
    return await robustMiddleman.put(`/api/v1/tenants/${tenantId}/customization`, { customization });
  }

  async getTenantPermissions(tenantId: string) {
    return await robustMiddleman.get(`/api/v1/tenants/${tenantId}/permissions`);
  }

  // Admin tenant management
  async updateTenantSettings(tenantId: string, settings: any) {
    return await robustMiddleman.put(`/api/v1/admin/tenants/${tenantId}`, settings);
  }

  async toggleTenantWhiteLabel(tenantId: string, enabled: boolean) {
    return await robustMiddleman.patch(`/api/v1/admin/tenants/${tenantId}/white-label`, { enabled });
  }

  // Monitoring and metrics
  getMiddlemanHealth() {
    return robustMiddleman.getHealthStatus();
  }

  getMiddlemanMetrics() {
    return robustMiddleman.getMetrics();
  }

  getCircuitBreakerState() {
    return robustMiddleman.getCircuitBreakerState();
  }

  resetCircuitBreaker() {
    robustMiddleman.resetCircuitBreaker();
  }

  clearMetrics() {
    robustMiddleman.clearMetrics();
  }

  // Utility methods
  generateSecurePassword(length: number = 16) {
    return backendUserManager.generateSecurePassword(length);
  }
}

// Singleton instance
export const integratedApi = new IntegratedApiService();

// Export for backward compatibility
export default integratedApi;
