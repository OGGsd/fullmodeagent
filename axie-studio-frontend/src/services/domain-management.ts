// Domain Management Service for Multi-Tenant Custom Domains
// Handles DNS verification, SSL certificates, and domain routing

import { integratedApi } from './integrated-api';
import { type TenantConfig } from '../config/tenant-config';

export interface DomainVerification {
  domain: string;
  verified: boolean;
  dnsRecords: {
    type: 'CNAME' | 'A';
    name: string;
    value: string;
    ttl: number;
  }[];
  sslStatus: 'pending' | 'active' | 'failed' | 'expired';
  sslExpiry?: string;
  lastChecked: string;
}

export interface CustomDomainSetup {
  tenantId: string;
  customDomain: string;
  subdomain?: string; // Optional subdomain (ai.client.com)
  verificationMethod: 'dns' | 'file';
  autoSSL: boolean;
}

export class DomainManagementService {
  
  // Initiate custom domain setup for a tenant
  async setupCustomDomain(setup: CustomDomainSetup): Promise<DomainVerification> {
    try {
      const response = await integratedApi.post('/api/v1/domains/setup', setup);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to setup custom domain: ${error.message}`);
    }
  }

  // Verify domain ownership
  async verifyDomain(domain: string): Promise<DomainVerification> {
    try {
      const response = await integratedApi.post(`/api/v1/domains/${domain}/verify`);
      return response;
    } catch (error: any) {
      throw new Error(`Domain verification failed: ${error.message}`);
    }
  }

  // Get domain verification status
  async getDomainStatus(domain: string): Promise<DomainVerification> {
    try {
      const response = await integratedApi.get(`/api/v1/domains/${domain}/status`);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to get domain status: ${error.message}`);
    }
  }

  // Generate DNS records for domain verification
  generateDNSRecords(domain: string, tenantId: string): DomainVerification['dnsRecords'] {
    const baseUrl = window.location.hostname.includes('axiestudio.com') 
      ? 'axiestudio.com' 
      : window.location.hostname;

    return [
      {
        type: 'CNAME',
        name: domain,
        value: `${tenantId}.${baseUrl}`,
        ttl: 300
      },
      {
        type: 'CNAME',
        name: `www.${domain}`,
        value: `${tenantId}.${baseUrl}`,
        ttl: 300
      }
    ];
  }

  // Request SSL certificate for custom domain
  async requestSSLCertificate(domain: string): Promise<{
    status: 'pending' | 'issued' | 'failed';
    certificateId?: string;
    expiryDate?: string;
    error?: string;
  }> {
    try {
      const response = await integratedApi.post(`/api/v1/domains/${domain}/ssl`);
      return response;
    } catch (error: any) {
      throw new Error(`SSL certificate request failed: ${error.message}`);
    }
  }

  // Check SSL certificate status
  async getSSLStatus(domain: string): Promise<{
    status: 'active' | 'pending' | 'expired' | 'failed';
    issuer?: string;
    expiryDate?: string;
    daysUntilExpiry?: number;
  }> {
    try {
      const response = await integratedApi.get(`/api/v1/domains/${domain}/ssl/status`);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to get SSL status: ${error.message}`);
    }
  }

  // Renew SSL certificate
  async renewSSLCertificate(domain: string): Promise<void> {
    try {
      await integratedApi.post(`/api/v1/domains/${domain}/ssl/renew`);
    } catch (error: any) {
      throw new Error(`SSL certificate renewal failed: ${error.message}`);
    }
  }

  // Remove custom domain
  async removeCustomDomain(domain: string): Promise<void> {
    try {
      await integratedApi.delete(`/api/v1/domains/${domain}`);
    } catch (error: any) {
      throw new Error(`Failed to remove custom domain: ${error.message}`);
    }
  }

  // Get all domains for a tenant
  async getTenantDomains(tenantId: string): Promise<DomainVerification[]> {
    try {
      const response = await integratedApi.get(`/api/v1/tenants/${tenantId}/domains`);
      return response.domains || [];
    } catch (error: any) {
      throw new Error(`Failed to get tenant domains: ${error.message}`);
    }
  }

  // Validate domain format
  validateDomain(domain: string): { valid: boolean; error?: string } {
    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');
    
    // Check for valid domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.)*[a-zA-Z]{2,}$/;
    
    if (!domainRegex.test(domain)) {
      return { valid: false, error: 'Invalid domain format' };
    }
    
    // Check for reserved domains
    const reservedDomains = ['axiestudio.com', 'localhost', '127.0.0.1'];
    if (reservedDomains.some(reserved => domain.includes(reserved))) {
      return { valid: false, error: 'Cannot use reserved domains' };
    }
    
    // Check length
    if (domain.length > 253) {
      return { valid: false, error: 'Domain name too long' };
    }
    
    return { valid: true };
  }

  // Check if domain is available (not already used by another tenant)
  async checkDomainAvailability(domain: string): Promise<{ available: boolean; usedBy?: string }> {
    try {
      const response = await integratedApi.get(`/api/v1/domains/${domain}/availability`);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to check domain availability: ${error.message}`);
    }
  }

  // Generate domain setup instructions
  generateSetupInstructions(domain: string, tenantId: string): {
    steps: string[];
    dnsRecords: DomainVerification['dnsRecords'];
    verificationUrl: string;
  } {
    const dnsRecords = this.generateDNSRecords(domain, tenantId);
    
    return {
      steps: [
        '1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)',
        '2. Navigate to DNS management for your domain',
        '3. Add the CNAME records shown below',
        '4. Wait 5-10 minutes for DNS propagation',
        '5. Click "Verify Domain" to complete setup',
        '6. SSL certificate will be automatically issued'
      ],
      dnsRecords,
      verificationUrl: `https://${domain}/.well-known/axiestudio-verification`
    };
  }

  // Monitor domain health
  async monitorDomainHealth(domain: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: {
      dns: boolean;
      ssl: boolean;
      connectivity: boolean;
      responseTime: number;
    };
    issues: string[];
  }> {
    try {
      const response = await integratedApi.get(`/api/v1/domains/${domain}/health`);
      return response;
    } catch (error: any) {
      throw new Error(`Domain health check failed: ${error.message}`);
    }
  }

  // Get domain analytics
  async getDomainAnalytics(domain: string, timeRange: string = '30d'): Promise<{
    requests: number;
    uniqueVisitors: number;
    bandwidth: number;
    responseTime: number;
    errorRate: number;
    topPages: { path: string; views: number }[];
  }> {
    try {
      const response = await integratedApi.get(`/api/v1/domains/${domain}/analytics?range=${timeRange}`);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to get domain analytics: ${error.message}`);
    }
  }

  // Bulk domain operations
  async bulkDomainOperation(operation: 'verify' | 'renew-ssl' | 'health-check', domains: string[]): Promise<{
    success: string[];
    failed: { domain: string; error: string }[];
  }> {
    try {
      const response = await integratedApi.post('/api/v1/domains/bulk', {
        operation,
        domains
      });
      return response;
    } catch (error: any) {
      throw new Error(`Bulk domain operation failed: ${error.message}`);
    }
  }

  // Get domain pricing tiers
  getDomainPricing(): {
    basic: { price: number; features: string[] };
    premium: { price: number; features: string[] };
    enterprise: { price: number; features: string[] };
  } {
    return {
      basic: {
        price: 0,
        features: [
          'Subdomain (client.axiestudio.com)',
          'Basic SSL certificate',
          'Standard support'
        ]
      },
      premium: {
        price: 49,
        features: [
          'Custom domain (ai.client.com)',
          'Premium SSL certificate',
          'Custom branding',
          'Priority support',
          'Domain analytics'
        ]
      },
      enterprise: {
        price: 199,
        features: [
          'Multiple custom domains',
          'Wildcard SSL certificates',
          'Advanced analytics',
          'SLA guarantee',
          'Dedicated support',
          'White-label options'
        ]
      }
    };
  }
}

export const domainManager = new DomainManagementService();
