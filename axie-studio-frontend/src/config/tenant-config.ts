// Multi-Tenant Configuration System
// Allows dynamic branding based on domain/subdomain

export interface TenantConfig {
  id: string;
  domain: string;
  customDomain?: string; // Client's own domain (ai.clientcompany.com)
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  favicon: string;
  loginBackground?: string;
  customCss?: string;
  tier: 'basic' | 'premium' | 'enterprise';
  features: {
    signup: boolean;
    marketplace: boolean;
    customComponents: boolean;
    customDomain: boolean;
    sso: boolean;
    whiteLabel: boolean;
  };
  contact: {
    email: string;
    website: string;
    support: string;
    phone?: string;
  };
  documentation: {
    baseUrl: string;
    customDocs: boolean;
  };
  ssl: {
    enabled: boolean;
    autoRenew: boolean;
    provider: 'letsencrypt' | 'custom';
  };
  analytics: {
    enabled: boolean;
    googleAnalytics?: string;
    customTracking?: string;
  };
  branding: {
    hideAxieStudioBranding: boolean;
    customFooter?: string;
    customTermsUrl?: string;
    customPrivacyUrl?: string;
  };
}

// Default Axie Studio configuration
const DEFAULT_TENANT: TenantConfig = {
  id: 'axiestudio',
  domain: 'axiestudio.com',
  name: 'Axie Studio',
  logo: 'https://www.axiestudio.se/logo.jpg',
  primaryColor: '#f59e0b',
  secondaryColor: '#1f2937',
  favicon: '/favicon-axiestudio.ico',
  tier: 'enterprise',
  features: {
    signup: false,
    marketplace: true,
    customComponents: true,
    customDomain: true,
    sso: true,
    whiteLabel: false
  },
  contact: {
    email: 'stefan@axiestudio.se',
    website: 'https://axiestudio.se',
    support: 'support@axiestudio.se'
  },
  documentation: {
    baseUrl: 'https://docs.axiestudio.com',
    customDocs: false
  },
  ssl: {
    enabled: true,
    autoRenew: true,
    provider: 'letsencrypt'
  },
  analytics: {
    enabled: true,
    googleAnalytics: 'GA-AXIESTUDIO-001'
  },
  branding: {
    hideAxieStudioBranding: false,
    customFooter: 'Powered by Axie Studio'
  }
};

// Multi-tenant configurations
const TENANT_CONFIGS: { [domain: string]: TenantConfig } = {
  // Default Axie Studio
  'axiestudio.com': DEFAULT_TENANT,
  'localhost': DEFAULT_TENANT,
  
  // Example client configurations
  'client1.axiestudio.com': {
    id: 'techcorp',
    domain: 'client1.axiestudio.com',
    customDomain: 'ai.techcorp.com',
    name: 'TechCorp AI Studio',
    logo: '/logos/techcorp-logo.png',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    favicon: '/favicons/techcorp-favicon.ico',
    tier: 'premium',
    features: {
      signup: true,
      marketplace: false,
      customComponents: false,
      customDomain: true,
      sso: true,
      whiteLabel: true
    },
    contact: {
      email: 'admin@techcorp.com',
      website: 'https://techcorp.com',
      support: 'support@techcorp.com',
      phone: '+1-555-TECH-CORP'
    },
    documentation: {
      baseUrl: 'https://docs.techcorp.com/ai-studio',
      customDocs: true
    },
    ssl: {
      enabled: true,
      autoRenew: true,
      provider: 'letsencrypt'
    },
    analytics: {
      enabled: true,
      googleAnalytics: 'GA-TECHCORP-001'
    },
    branding: {
      hideAxieStudioBranding: true,
      customFooter: '© 2024 TechCorp. All rights reserved.',
      customTermsUrl: 'https://techcorp.com/terms',
      customPrivacyUrl: 'https://techcorp.com/privacy'
    }
  },
  
  'client2.axiestudio.com': {
    id: 'innovate',
    domain: 'client2.axiestudio.com',
    customDomain: 'platform.innovate.ai',
    name: 'Innovate AI Platform',
    logo: '/logos/innovate-logo.png',
    primaryColor: '#10b981',
    secondaryColor: '#047857',
    favicon: '/favicons/innovate-favicon.ico',
    tier: 'enterprise',
    features: {
      signup: false,
      marketplace: true,
      customComponents: true,
      customDomain: true,
      sso: true,
      whiteLabel: true
    },
    contact: {
      email: 'hello@innovate.ai',
      website: 'https://innovate.ai',
      support: 'help@innovate.ai',
      phone: '+1-555-INNOVATE'
    },
    documentation: {
      baseUrl: 'https://help.innovate.ai',
      customDocs: true
    },
    ssl: {
      enabled: true,
      autoRenew: true,
      provider: 'letsencrypt'
    },
    analytics: {
      enabled: true,
      customTracking: 'https://analytics.innovate.ai/track'
    },
    branding: {
      hideAxieStudioBranding: true,
      customFooter: 'Powered by Innovate AI',
      customTermsUrl: 'https://innovate.ai/terms',
      customPrivacyUrl: 'https://innovate.ai/privacy'
    }
  }
};

// Get tenant configuration based on current domain
export const getCurrentTenant = (): TenantConfig => {
  const hostname = window.location.hostname;

  // Check for exact domain match (subdomains)
  if (TENANT_CONFIGS[hostname]) {
    return TENANT_CONFIGS[hostname];
  }

  // Check for custom domain match
  for (const config of Object.values(TENANT_CONFIGS)) {
    if (config.customDomain === hostname) {
      return config;
    }
  }

  // Check for subdomain pattern (*.axiestudio.com)
  const subdomainMatch = hostname.match(/^(.+)\.axiestudio\.com$/);
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1];
    const subdomainConfig = TENANT_CONFIGS[`${subdomain}.axiestudio.com`];
    if (subdomainConfig) {
      return subdomainConfig;
    }
  }

  // Check for wildcard custom domains (*.client.com)
  for (const config of Object.values(TENANT_CONFIGS)) {
    if (config.customDomain && config.customDomain.startsWith('*.')) {
      const baseDomain = config.customDomain.substring(2); // Remove *.
      if (hostname.endsWith(baseDomain)) {
        return config;
      }
    }
  }

  // Default to Axie Studio
  return DEFAULT_TENANT;
};

// Get tenant by ID (for admin management)
export const getTenantById = (tenantId: string): TenantConfig | null => {
  return Object.values(TENANT_CONFIGS).find(tenant => tenant.id === tenantId) || null;
};

// Get all tenants (for admin management)
export const getAllTenants = (): TenantConfig[] => {
  return Object.values(TENANT_CONFIGS);
};

// Add new tenant configuration
export const addTenant = (config: TenantConfig): void => {
  TENANT_CONFIGS[config.domain] = config;
  // In production, this would save to database
};

// Update tenant configuration
export const updateTenant = (domain: string, updates: Partial<TenantConfig>): void => {
  if (TENANT_CONFIGS[domain]) {
    TENANT_CONFIGS[domain] = { ...TENANT_CONFIGS[domain], ...updates };
    // In production, this would update database
  }
};

// Remove tenant configuration
export const removeTenant = (domain: string): void => {
  delete TENANT_CONFIGS[domain];
  // In production, this would delete from database
};

// Generate CSS variables for current tenant
export const getTenantCssVariables = (tenant: TenantConfig): string => {
  return `
    :root {
      --tenant-primary-color: ${tenant.primaryColor};
      --tenant-secondary-color: ${tenant.secondaryColor};
      --tenant-name: "${tenant.name}";
    }
    
    .tenant-primary-bg { background-color: ${tenant.primaryColor}; }
    .tenant-primary-text { color: ${tenant.primaryColor}; }
    .tenant-secondary-bg { background-color: ${tenant.secondaryColor}; }
    .tenant-secondary-text { color: ${tenant.secondaryColor}; }
    
    ${tenant.customCss || ''}
  `;
};

// Apply tenant branding to document
export const applyTenantBranding = (tenant: TenantConfig): void => {
  // Update page title
  document.title = `${tenant.name} - AI Workflow Platform`;
  
  // Update favicon
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    favicon.href = tenant.favicon;
  }
  
  // Inject tenant CSS
  const existingStyle = document.getElementById('tenant-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = 'tenant-styles';
  style.textContent = getTenantCssVariables(tenant);
  document.head.appendChild(style);
  
  // Update meta tags
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (metaDescription) {
    metaDescription.content = `${tenant.name} - Build powerful AI workflows with ease`;
  }
};

// Tenant-aware URL generation
export const getTenantUrl = (path: string, tenant?: TenantConfig): string => {
  const currentTenant = tenant || getCurrentTenant();
  const protocol = window.location.protocol;
  return `${protocol}//${currentTenant.domain}${path}`;
};

// Check if feature is enabled for current tenant
export const isFeatureEnabled = (feature: keyof TenantConfig['features'], tenant?: TenantConfig): boolean => {
  const currentTenant = tenant || getCurrentTenant();
  return currentTenant.features[feature];
};

// Get tenant-specific documentation URL
export const getDocumentationUrl = (path: string = '', tenant?: TenantConfig): string => {
  const currentTenant = tenant || getCurrentTenant();
  return `${currentTenant.documentation.baseUrl}${path}`;
};

// Get tenant-specific support email
export const getSupportEmail = (tenant?: TenantConfig): string => {
  const currentTenant = tenant || getCurrentTenant();
  return currentTenant.contact.support;
};

// Initialize tenant on app startup
export const initializeTenant = (): TenantConfig => {
  const tenant = getCurrentTenant();
  applyTenantBranding(tenant);
  return tenant;
};
