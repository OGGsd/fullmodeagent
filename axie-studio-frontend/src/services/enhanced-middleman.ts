// Enhanced Middleman Framework for Axie Studio
// Advanced integration with Langflow while maintaining complete white-label control

import { robustMiddleman } from './robust-middleman';
import { getCurrentTenant } from '../config/tenant-config';
import { backendUserManager } from './backend-user-management';

interface AxieStudioRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  tenantId?: string;
}

interface AxieStudioResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  tenant?: string;
  branding?: {
    hideAxieStudioBranding: boolean;
    customLogo?: string;
    primaryColor?: string;
  };
}

export class EnhancedMiddlemanService {
  private tenant = getCurrentTenant();

  // Template and Example Management
  async getTemplates(): Promise<AxieStudioResponse> {
    try {
      // First try to get Axie Studio custom templates
      const customTemplates = await this.getAxieStudioTemplates();
      
      if (customTemplates.length > 0) {
        return {
          success: true,
          data: customTemplates,
          message: 'Axie Studio templates loaded'
        };
      }

      // Fallback to Langflow templates but rebrand them
      const langflowTemplates = await robustMiddleman.get('/api/v1/flows/basic_examples/');
      const rebrandedTemplates = this.rebrandTemplates(langflowTemplates);

      return {
        success: true,
        data: rebrandedTemplates,
        message: 'Templates loaded and rebranded'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: `Failed to load templates: ${error.message}`
      };
    }
  }

  private async getAxieStudioTemplates() {
    // Custom Axie Studio templates
    const axieStudioTemplates = [
      {
        id: 'axie-basic-chat',
        name: 'Axie Studio Basic Chat',
        description: 'A simple chat interface powered by Axie Studio',
        category: 'Chat',
        data: {
          // Template flow data here
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        is_component: false,
        updated_at: new Date().toISOString(),
        folder_id: null,
        user_id: null
      },
      {
        id: 'axie-rag-assistant',
        name: 'Axie Studio RAG Assistant',
        description: 'Retrieval-Augmented Generation assistant with Axie Studio branding',
        category: 'RAG',
        data: {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        is_component: false,
        updated_at: new Date().toISOString(),
        folder_id: null,
        user_id: null
      },
      {
        id: 'axie-agent-workflow',
        name: 'Axie Studio Agent Workflow',
        description: 'Multi-agent workflow template for complex tasks',
        category: 'Agents',
        data: {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        is_component: false,
        updated_at: new Date().toISOString(),
        folder_id: null,
        user_id: null
      }
    ];

    return axieStudioTemplates;
  }

  private rebrandTemplates(templates: any[]): any[] {
    return templates.map(template => ({
      ...template,
      name: template.name?.replace(/langflow/gi, 'Axie Studio') || template.name,
      description: template.description?.replace(/langflow/gi, 'Axie Studio') || template.description,
      // Add Axie Studio metadata
      axie_studio_rebranded: true,
      original_source: 'langflow',
      rebranded_at: new Date().toISOString()
    }));
  }

  // Enhanced API Request with White-Label Support
  async makeRequest<T = any>(request: AxieStudioRequest): Promise<AxieStudioResponse<T>> {
    try {
      const headers = {
        ...request.headers,
        'X-Axie-Studio-Tenant': this.tenant?.id || 'default',
        'X-Axie-Studio-Version': '1.0.0',
        'X-White-Label-Enabled': this.tenant?.features.whiteLabel ? 'true' : 'false'
      };

      let response;
      switch (request.method) {
        case 'GET':
          response = await robustMiddleman.get(request.endpoint, { headers });
          break;
        case 'POST':
          response = await robustMiddleman.post(request.endpoint, request.data, { headers });
          break;
        case 'PUT':
          response = await robustMiddleman.put(request.endpoint, request.data, { headers });
          break;
        case 'DELETE':
          response = await robustMiddleman.delete(request.endpoint, { headers });
          break;
        default:
          throw new Error(`Unsupported method: ${request.method}`);
      }

      // Apply white-label transformations
      const transformedData = this.applyWhiteLabelTransforms(response);

      return {
        success: true,
        data: transformedData,
        tenant: this.tenant?.id,
        branding: {
          hideAxieStudioBranding: this.tenant?.branding?.hideAxieStudioBranding || false,
          customLogo: this.tenant?.logo,
          primaryColor: this.tenant?.primaryColor
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message,
        tenant: this.tenant?.id
      };
    }
  }

  private applyWhiteLabelTransforms(data: any): any {
    if (!this.tenant?.features.whiteLabel) {
      return data;
    }

    // Recursively replace Langflow references with tenant branding
    const transform = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/langflow/gi, this.tenant?.name || 'Axie Studio')
          .replace(/Langflow/g, this.tenant?.name || 'Axie Studio');
      }
      
      if (Array.isArray(obj)) {
        return obj.map(transform);
      }
      
      if (obj && typeof obj === 'object') {
        const transformed: any = {};
        for (const [key, value] of Object.entries(obj)) {
          transformed[key] = transform(value);
        }
        return transformed;
      }
      
      return obj;
    };

    return transform(data);
  }

  // Enhanced Flow Management
  async createFlow(flowData: any): Promise<AxieStudioResponse> {
    // Add Axie Studio metadata to flows
    const enhancedFlowData = {
      ...flowData,
      metadata: {
        ...flowData.metadata,
        created_with: 'Axie Studio',
        version: '1.0.0',
        tenant_id: this.tenant?.id,
        white_label_enabled: this.tenant?.features.whiteLabel || false
      }
    };

    return this.makeRequest({
      endpoint: '/api/v1/flows/',
      method: 'POST',
      data: enhancedFlowData
    });
  }

  // Enhanced User Management Integration
  async getUserFlows(userId?: string): Promise<AxieStudioResponse> {
    try {
      const currentUser = await backendUserManager.getCurrentUser();
      const targetUserId = userId || currentUser.id;
      
      const flows = await backendUserManager.getUserFlows(targetUserId);
      
      // Apply white-label transformations
      const transformedFlows = this.applyWhiteLabelTransforms(flows);
      
      return {
        success: true,
        data: transformedFlows,
        message: `Loaded ${flows.length} flows for user`,
        tenant: this.tenant?.id
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }

  // Component Store Integration
  async getComponents(): Promise<AxieStudioResponse> {
    try {
      // Get components from Langflow backend
      const components = await robustMiddleman.get('/api/v1/components/');
      
      // Add Axie Studio custom components
      const customComponents = await this.getAxieStudioComponents();
      
      // Merge and rebrand
      const allComponents = [...customComponents, ...this.rebrandComponents(components)];
      
      return {
        success: true,
        data: allComponents,
        message: 'Components loaded with Axie Studio enhancements'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }

  private async getAxieStudioComponents() {
    // Custom Axie Studio components that extend Langflow
    return [
      {
        display_name: 'Axie Studio Chat Input',
        description: 'Enhanced chat input with Axie Studio branding',
        category: 'Axie Studio',
        custom: true,
        axie_studio_component: true
      },
      {
        display_name: 'Axie Studio White-Label Output',
        description: 'Output component that respects white-label settings',
        category: 'Axie Studio',
        custom: true,
        axie_studio_component: true
      }
    ];
  }

  private rebrandComponents(components: any[]): any[] {
    return components.map(component => ({
      ...component,
      display_name: component.display_name?.replace(/langflow/gi, 'Axie Studio') || component.display_name,
      description: component.description?.replace(/langflow/gi, 'Axie Studio') || component.description,
      axie_studio_enhanced: true
    }));
  }

  // Health Check with Branding
  async healthCheck(): Promise<AxieStudioResponse> {
    try {
      const backendHealth = await robustMiddleman.get('/health_check');
      
      return {
        success: true,
        data: {
          ...backendHealth,
          axie_studio_middleman: 'healthy',
          white_label_enabled: this.tenant?.features.whiteLabel || false,
          tenant: this.tenant?.name || 'Default'
        },
        message: 'Axie Studio system healthy'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  // Documentation Integration
  getDocumentationUrl(): string {
    if (this.tenant?.documentation?.customDocs && this.tenant?.documentation?.baseUrl) {
      return this.tenant.documentation.baseUrl;
    }
    
    // Default to Axie Studio docs with proper subdomain structure
    const baseUrl = window.location.origin;
    return `${baseUrl}/docs/docs/`;
  }

  // Analytics and Monitoring
  async trackEvent(event: string, properties: Record<string, any> = {}): Promise<void> {
    if (!this.tenant?.analytics?.enabled) {
      return;
    }

    const eventData = {
      event,
      properties: {
        ...properties,
        tenant_id: this.tenant?.id,
        white_label_enabled: this.tenant?.features.whiteLabel,
        timestamp: new Date().toISOString()
      }
    };

    // Send to analytics service (implement based on your analytics provider)
    console.log('Axie Studio Analytics:', eventData);
  }
}

// Singleton instance
export const enhancedMiddleman = new EnhancedMiddlemanService();