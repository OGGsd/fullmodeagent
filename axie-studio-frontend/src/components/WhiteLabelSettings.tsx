import React, { useState, useEffect } from 'react';
import { getCurrentTenant, type TenantConfig } from '../config/tenant-config';
import { integratedApi } from '../services/integrated-api';

interface WhiteLabelCustomization {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  customFooter?: string;
  hideAxieStudioBranding?: boolean;
}

export default function WhiteLabelSettings() {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [customization, setCustomization] = useState<WhiteLabelCustomization>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const currentTenant = getCurrentTenant();
    setTenant(currentTenant);
    
    // Load existing customization
    loadCustomization(currentTenant.id);
  }, []);

  const loadCustomization = async (tenantId: string) => {
    try {
      setIsLoading(true);
      const response = await integratedApi.get(`/api/v1/tenants/${tenantId}/customization`);
      setCustomization(response.customization || {});
    } catch (error) {
      console.error('Failed to load customization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomization = async () => {
    if (!tenant) return;

    try {
      setIsSaving(true);
      await integratedApi.put(`/api/v1/tenants/${tenant.id}/customization`, {
        customization
      });
      
      setMessage({ type: 'success', text: 'White-label settings saved successfully!' });
      
      // Apply changes immediately
      applyCustomization();
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const applyCustomization = () => {
    // Apply CSS variables for immediate preview
    const root = document.documentElement;
    
    if (customization.primaryColor) {
      root.style.setProperty('--tenant-primary-color', customization.primaryColor);
    }
    
    if (customization.secondaryColor) {
      root.style.setProperty('--tenant-secondary-color', customization.secondaryColor);
    }
    
    // Update page title if company name is set
    if (customization.companyName) {
      document.title = `${customization.companyName} - AI Workflow Platform`;
    }
  };

  const resetToDefaults = () => {
    setCustomization({
      logo: tenant?.logo,
      primaryColor: tenant?.primaryColor,
      secondaryColor: tenant?.secondaryColor,
      companyName: tenant?.name,
      customFooter: '',
      hideAxieStudioBranding: false
    });
  };

  // Don't show if white-label is not enabled by admin
  if (!tenant?.features.whiteLabel) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          White-Label Features Not Available
        </h3>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Contact your administrator to enable white-label customization features.
        </p>
        <button
          onClick={() => window.open(`mailto:${tenant?.contact.support}?subject=White-Label Features Request`, '_blank')}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Contact Administrator
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>Loading white-label settings...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          🎨 White-Label Customization
        </h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Customize the appearance and branding of your AI platform.
        </p>
        
        {message && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message.text}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Logo Customization */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Logo & Branding
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Company Name
              </label>
              <input
                type="text"
                value={customization.companyName || ''}
                onChange={(e) => setCustomization({ ...customization, companyName: e.target.value })}
                placeholder="Your Company Name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Logo URL
              </label>
              <input
                type="url"
                value={customization.logo || ''}
                onChange={(e) => setCustomization({ ...customization, logo: e.target.value })}
                placeholder="https://yourcompany.com/logo.png"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
              {customization.logo && (
                <div style={{ marginTop: '8px' }}>
                  <img 
                    src={customization.logo} 
                    alt="Logo Preview"
                    style={{ height: '40px', maxWidth: '200px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Color Customization */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Color Scheme
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Primary Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={customization.primaryColor || tenant?.primaryColor || '#f59e0b'}
                  onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={customization.primaryColor || tenant?.primaryColor || '#f59e0b'}
                  onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Secondary Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={customization.secondaryColor || tenant?.secondaryColor || '#1f2937'}
                  onChange={(e) => setCustomization({ ...customization, secondaryColor: e.target.value })}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={customization.secondaryColor || tenant?.secondaryColor || '#1f2937'}
                  onChange={(e) => setCustomization({ ...customization, secondaryColor: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Customization */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Footer & Branding
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Custom Footer Text
              </label>
              <input
                type="text"
                value={customization.customFooter || ''}
                onChange={(e) => setCustomization({ ...customization, customFooter: e.target.value })}
                placeholder="© 2024 Your Company. All rights reserved."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            {tenant?.branding.hideAxieStudioBranding && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={customization.hideAxieStudioBranding || false}
                    onChange={(e) => setCustomization({ ...customization, hideAxieStudioBranding: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: '500' }}>Hide "Powered by Axie Studio"</span>
                </label>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
                  Remove Axie Studio branding from your platform
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={resetToDefaults}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reset to Defaults
          </button>
          
          <button
            onClick={applyCustomization}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Preview Changes
          </button>
          
          <button
            onClick={saveCustomization}
            disabled={isSaving}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
