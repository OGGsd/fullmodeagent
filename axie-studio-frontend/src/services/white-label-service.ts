// White-Label Service - Handles user customization when admin enables it
// Only works when admin has set whiteLabel: true for the tenant

import { integratedApi } from './integrated-api';
import { getCurrentTenant } from '../config/tenant-config';

export interface WhiteLabelCustomization {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  customFooter?: string;
  hideAxieStudioBranding?: boolean;
  customCss?: string;
}

export interface WhiteLabelPermissions {
  canCustomizeLogo: boolean;
  canCustomizeColors: boolean;
  canCustomizeFooter: boolean;
  canHideBranding: boolean;
  canAddCustomCss: boolean;
}

export class WhiteLabelService {
  
  // Check if white-label features are enabled for current tenant
  isWhiteLabelEnabled(): boolean {
    const tenant = getCurrentTenant();
    return tenant.features.whiteLabel;
  }

  // Get white-label permissions for current tenant
  getPermissions(): WhiteLabelPermissions {
    const tenant = getCurrentTenant();
    
    if (!tenant.features.whiteLabel) {
      return {
        canCustomizeLogo: false,
        canCustomizeColors: false,
        canCustomizeFooter: false,
        canHideBranding: false,
        canAddCustomCss: false
      };
    }

    return {
      canCustomizeLogo: true,
      canCustomizeColors: true,
      canCustomizeFooter: true,
      canHideBranding: tenant.branding.hideAxieStudioBranding,
      canAddCustomCss: tenant.tier === 'enterprise'
    };
  }

  // Get current customization settings
  async getCustomization(): Promise<WhiteLabelCustomization> {
    if (!this.isWhiteLabelEnabled()) {
      throw new Error('White-label features are not enabled for this tenant');
    }

    try {
      const tenant = getCurrentTenant();
      const response = await integratedApi.get(`/api/v1/tenants/${tenant.id}/customization`);
      return response.customization || {};
    } catch (error: any) {
      throw new Error(`Failed to get customization: ${error.message}`);
    }
  }

  // Save customization settings
  async saveCustomization(customization: WhiteLabelCustomization): Promise<void> {
    if (!this.isWhiteLabelEnabled()) {
      throw new Error('White-label features are not enabled for this tenant');
    }

    try {
      const tenant = getCurrentTenant();
      await integratedApi.put(`/api/v1/tenants/${tenant.id}/customization`, {
        customization
      });
    } catch (error: any) {
      throw new Error(`Failed to save customization: ${error.message}`);
    }
  }

  // Apply customization to current page
  applyCustomization(customization: WhiteLabelCustomization): void {
    const root = document.documentElement;
    
    // Apply colors
    if (customization.primaryColor) {
      root.style.setProperty('--tenant-primary-color', customization.primaryColor);
    }
    
    if (customization.secondaryColor) {
      root.style.setProperty('--tenant-secondary-color', customization.secondaryColor);
    }
    
    // Update page title
    if (customization.companyName) {
      document.title = `${customization.companyName} - AI Workflow Platform`;
    }
    
    // Apply custom CSS
    if (customization.customCss) {
      this.injectCustomCSS(customization.customCss);
    }
    
    // Update logo if present
    if (customization.logo) {
      this.updateLogo(customization.logo);
    }
    
    // Update footer
    if (customization.customFooter) {
      this.updateFooter(customization.customFooter);
    }
    
    // Hide Axie Studio branding if enabled
    if (customization.hideAxieStudioBranding) {
      this.hideAxieStudioBranding();
    }
  }

  // Inject custom CSS
  private injectCustomCSS(css: string): void {
    const existingStyle = document.getElementById('white-label-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'white-label-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Update logo elements
  private updateLogo(logoUrl: string): void {
    const logoElements = document.querySelectorAll('[data-tenant-logo]');
    logoElements.forEach((element) => {
      if (element instanceof HTMLImageElement) {
        element.src = logoUrl;
      }
    });
  }

  // Update footer text
  private updateFooter(footerText: string): void {
    const footerElements = document.querySelectorAll('[data-tenant-footer]');
    footerElements.forEach((element) => {
      element.textContent = footerText;
    });
  }

  // Hide Axie Studio branding
  private hideAxieStudioBranding(): void {
    const brandingElements = document.querySelectorAll('[data-axie-branding]');
    brandingElements.forEach((element) => {
      (element as HTMLElement).style.display = 'none';
    });
  }

  // Generate CSS for tenant customization
  generateTenantCSS(customization: WhiteLabelCustomization): string {
    let css = `
      :root {
        --tenant-primary-color: ${customization.primaryColor || '#f59e0b'};
        --tenant-secondary-color: ${customization.secondaryColor || '#1f2937'};
      }
      
      .tenant-primary-bg { background-color: var(--tenant-primary-color); }
      .tenant-primary-text { color: var(--tenant-primary-color); }
      .tenant-secondary-bg { background-color: var(--tenant-secondary-color); }
      .tenant-secondary-text { color: var(--tenant-secondary-color); }
      
      .tenant-button {
        background-color: var(--tenant-primary-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .tenant-button:hover {
        opacity: 0.9;
      }
    `;

    if (customization.hideAxieStudioBranding) {
      css += `
        [data-axie-branding] {
          display: none !important;
        }
      `;
    }

    if (customization.customCss) {
      css += `\n${customization.customCss}`;
    }

    return css;
  }

  // Validate customization input
  validateCustomization(customization: WhiteLabelCustomization): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate logo URL
    if (customization.logo && !this.isValidUrl(customization.logo)) {
      errors.push('Logo URL is not valid');
    }
    
    // Validate colors
    if (customization.primaryColor && !this.isValidColor(customization.primaryColor)) {
      errors.push('Primary color is not valid');
    }
    
    if (customization.secondaryColor && !this.isValidColor(customization.secondaryColor)) {
      errors.push('Secondary color is not valid');
    }
    
    // Validate company name
    if (customization.companyName && customization.companyName.length > 100) {
      errors.push('Company name is too long (max 100 characters)');
    }
    
    // Validate custom CSS (basic check)
    if (customization.customCss && customization.customCss.length > 10000) {
      errors.push('Custom CSS is too long (max 10,000 characters)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper: Validate URL
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Helper: Validate color (hex or rgb)
  private isValidColor(color: string): boolean {
    // Check hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check rgb/rgba color
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
      return true;
    }
    
    return false;
  }

  // Get default customization based on tenant
  getDefaultCustomization(): WhiteLabelCustomization {
    const tenant = getCurrentTenant();
    
    return {
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      companyName: tenant.name,
      customFooter: `© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.`,
      hideAxieStudioBranding: false,
      customCss: ''
    };
  }

  // Reset customization to defaults
  async resetToDefaults(): Promise<void> {
    const defaultCustomization = this.getDefaultCustomization();
    await this.saveCustomization(defaultCustomization);
    this.applyCustomization(defaultCustomization);
  }

  // Export customization as JSON
  exportCustomization(customization: WhiteLabelCustomization): string {
    return JSON.stringify(customization, null, 2);
  }

  // Import customization from JSON
  importCustomization(jsonString: string): WhiteLabelCustomization {
    try {
      const customization = JSON.parse(jsonString);
      const validation = this.validateCustomization(customization);
      
      if (!validation.valid) {
        throw new Error(`Invalid customization: ${validation.errors.join(', ')}`);
      }
      
      return customization;
    } catch (error: any) {
      throw new Error(`Failed to import customization: ${error.message}`);
    }
  }

  // Get contact info for requesting white-label features
  getContactInfo(): { email: string; subject: string; body: string } {
    const tenant = getCurrentTenant();
    
    return {
      email: tenant.contact.support,
      subject: 'White-Label Features Request',
      body: `Hello,

I would like to request white-label customization features for my account.

Current tenant: ${tenant.name}
Domain: ${tenant.domain}

Please enable white-label features so I can:
- Customize logo and branding
- Change color scheme
- Add custom footer
- Hide Axie Studio branding

Thank you!`
    };
  }
}

export const whiteLabelService = new WhiteLabelService();
