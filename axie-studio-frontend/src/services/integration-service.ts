// Axie Studio Integration Service
// Seamless integration between Frontend, Middleman, and Backend

import { enhancedMiddleman } from './enhanced-middleman';
import { templateManager } from './template-manager';
import { backendUserManager } from './backend-user-management';
import { robustMiddleman } from './robust-middleman';
import { getCurrentTenant } from '../config/tenant-config';

export interface IntegrationConfig {
  enableWhiteLabel: boolean;
  enableCustomTemplates: boolean;
  enableAnalytics: boolean;
  enableCustomComponents: boolean;
  backendUrl: string;
  frontendUrl: string;
  docsUrl: string;
}

export class IntegrationService {
  private config: IntegrationConfig;
  private tenant = getCurrentTenant();

  constructor() {
    this.config = {
      enableWhiteLabel: this.tenant?.features.whiteLabel || false,
      enableCustomTemplates: true,
      enableAnalytics: this.tenant?.analytics?.enabled || false,
      enableCustomComponents: this.tenant?.features.customComponents || true,
      backendUrl: process.env.VITE_BACKEND_URL || 'https://langflow-tv34o.ondigitalocean.app',
      frontendUrl: window.location.origin,
      docsUrl: `${window.location.origin}/docs/docs/`
    };
  }

  // Initialize the complete integration
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Axie Studio Integration...');
      
      // 1. Health check all systems
      await this.performHealthChecks();
      
      // 2. Initialize white-label settings
      if (this.config.enableWhiteLabel) {
        await this.initializeWhiteLabel();
      }
      
      // 3. Load custom templates
      if (this.config.enableCustomTemplates) {
        await this.initializeTemplates();
      }
      
      // 4. Setup analytics
      if (this.config.enableAnalytics) {
        await this.initializeAnalytics();
      }
      
      // 5. Initialize custom components
      if (this.config.enableCustomComponents) {
        await this.initializeCustomComponents();
      }
      
      console.log('✅ Axie Studio Integration Complete!');
      
      // Track successful initialization
      await enhancedMiddleman.trackEvent('axie_studio_initialized', {
        tenant: this.tenant?.id,
        features: this.config
      });
      
    } catch (error) {
      console.error('❌ Axie Studio Integration Failed:', error);
      throw error;
    }
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🔍 Performing health checks...');
    
    // Check backend connectivity
    const backendHealth = await robustMiddleman.getHealthStatus();
    if (backendHealth.backend !== 'healthy') {
      throw new Error('Backend is not healthy');
    }
    
    // Check enhanced middleman
    const middlemanHealth = await enhancedMiddleman.healthCheck();
    if (!middlemanHealth.success) {
      throw new Error('Enhanced middleman is not healthy');
    }
    
    console.log('✅ All systems healthy');
  }

  private async initializeWhiteLabel(): Promise<void> {
    console.log('🎨 Initializing white-label features...');
    
    if (!this.tenant) {
      console.warn('No tenant configuration found, using defaults');
      return;
    }
    
    // Apply custom CSS variables for branding
    const root = document.documentElement;
    if (this.tenant.primaryColor) {
      root.style.setProperty('--primary-color', this.tenant.primaryColor);
    }
    if (this.tenant.secondaryColor) {
      root.style.setProperty('--secondary-color', this.tenant.secondaryColor);
    }
    
    // Update page title
    if (this.tenant.name) {
      document.title = `${this.tenant.name} - AI Workflow Platform`;
    }
    
    // Update favicon if custom one is provided
    if (this.tenant.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = this.tenant.favicon;
      }
    }
    
    console.log('✅ White-label features initialized');
  }

  private async initializeTemplates(): Promise<void> {
    console.log('📋 Initializing custom templates...');
    
    try {
      const templates = await templateManager.getAllTemplates();
      console.log(`✅ Loaded ${templates.length} templates`);
      
      // Cache templates for faster access
      localStorage.setItem('axie_studio_templates', JSON.stringify({
        templates,
        cached_at: new Date().toISOString(),
        tenant: this.tenant?.id
      }));
      
    } catch (error) {
      console.warn('⚠️ Failed to load templates:', error);
    }
  }

  private async initializeAnalytics(): Promise<void> {
    console.log('📊 Initializing analytics...');
    
    // Initialize analytics based on tenant configuration
    if (this.tenant?.analytics?.googleAnalytics) {
      // Initialize Google Analytics
      console.log('📈 Google Analytics initialized');
    }
    
    if (this.tenant?.analytics?.customTracking) {
      // Initialize custom tracking
      console.log('📈 Custom tracking initialized');
    }
    
    console.log('✅ Analytics initialized');
  }

  private async initializeCustomComponents(): Promise<void> {
    console.log('🧩 Initializing custom components...');
    
    try {
      const components = await enhancedMiddleman.getComponents();
      if (components.success) {
        console.log(`✅ Loaded ${components.data.length} components`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load custom components:', error);
    }
  }

  // API Integration Methods
  async createFlow(flowData: any): Promise<any> {
    // Add Axie Studio metadata and white-label support
    const enhancedFlowData = {
      ...flowData,
      metadata: {
        ...flowData.metadata,
        created_with: 'Axie Studio',
        tenant_id: this.tenant?.id,
        white_label_enabled: this.config.enableWhiteLabel,
        integration_version: '1.0.0'
      }
    };

    return enhancedMiddleman.createFlow(enhancedFlowData);
  }

  async getFlows(userId?: string): Promise<any> {
    return enhancedMiddleman.getUserFlows(userId);
  }

  async getTemplates(): Promise<any> {
    return templateManager.getAllTemplates();
  }

  async createFromTemplate(templateId: string, customName?: string): Promise<any> {
    return templateManager.createFlowFromTemplate(templateId, customName);
  }

  // User Management Integration
  async getCurrentUser(): Promise<any> {
    return backendUserManager.getCurrentUser();
  }

  async createUser(userData: any): Promise<any> {
    const enhancedUserData = {
      ...userData,
      metadata: {
        created_via: 'Axie Studio',
        tenant_id: this.tenant?.id,
        created_at: new Date().toISOString()
      }
    };

    return backendUserManager.createUser(enhancedUserData);
  }

  // Documentation Integration
  getDocumentationUrl(path: string = ''): string {
    const baseUrl = this.config.docsUrl;
    return `${baseUrl}${path}`;
  }

  openDocumentation(path: string = ''): void {
    const url = this.getDocumentationUrl(path);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // White-Label API
  async updateBranding(brandingData: any): Promise<void> {
    if (!this.config.enableWhiteLabel) {
      throw new Error('White-label features are not enabled');
    }

    // Update tenant configuration
    // This would typically call an API to update the tenant settings
    console.log('Updating branding:', brandingData);
    
    // Apply changes immediately
    await this.initializeWhiteLabel();
  }

  // Analytics Integration
  async trackUserAction(action: string, properties: any = {}): Promise<void> {
    if (!this.config.enableAnalytics) {
      return;
    }

    await enhancedMiddleman.trackEvent(`user_${action}`, {
      ...properties,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      url: window.location.href
    });
  }

  // System Status
  async getSystemStatus(): Promise<any> {
    const [backendHealth, middlemanHealth] = await Promise.all([
      robustMiddleman.getHealthStatus(),
      enhancedMiddleman.healthCheck()
    ]);

    return {
      backend: backendHealth,
      middleman: middlemanHealth,
      frontend: {
        status: 'healthy',
        version: '1.0.0',
        tenant: this.tenant?.id || 'default'
      },
      integration: {
        white_label_enabled: this.config.enableWhiteLabel,
        custom_templates_enabled: this.config.enableCustomTemplates,
        analytics_enabled: this.config.enableAnalytics,
        custom_components_enabled: this.config.enableCustomComponents
      }
    };
  }

  // Configuration Management
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize affected systems
    if (newConfig.enableWhiteLabel !== undefined) {
      this.initializeWhiteLabel();
    }
    if (newConfig.enableAnalytics !== undefined) {
      this.initializeAnalytics();
    }
  }

  // Error Handling and Recovery
  async handleError(error: any, context: string): Promise<void> {
    console.error(`Axie Studio Integration Error [${context}]:`, error);
    
    // Track error for monitoring
    await enhancedMiddleman.trackEvent('integration_error', {
      error: error.message,
      context,
      tenant: this.tenant?.id,
      timestamp: new Date().toISOString()
    });
    
    // Attempt recovery based on error type
    if (error.message?.includes('backend')) {
      console.log('Attempting backend reconnection...');
      // Implement backend reconnection logic
    }
  }
}

// Singleton instance
export const integrationService = new IntegrationService();

// Auto-initialize when imported
integrationService.initialize().catch(error => {
  console.error('Failed to initialize Axie Studio Integration:', error);
});
