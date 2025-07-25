import React, { useState, useEffect } from 'react';
import { getAllTenants, addTenant, updateTenant, removeTenant, type TenantConfig } from '../../config/tenant-config';
import { domainManager, type DomainVerification } from '../../services/domain-management';

export default function TenantManagement() {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [editingTenant, setEditingTenant] = useState<TenantConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [domainVerifications, setDomainVerifications] = useState<{ [domain: string]: DomainVerification }>({});
  const [showDomainSetup, setShowDomainSetup] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TenantConfig>>({
    name: '',
    domain: '',
    logo: '',
    primaryColor: '#f59e0b',
    secondaryColor: '#1f2937',
    tier: 'basic',
    features: {
      signup: false,
      marketplace: true,
      customComponents: true,
      customDomain: false,
      sso: false,
      whiteLabel: false
    },
    contact: {
      email: '',
      website: '',
      support: ''
    },
    documentation: {
      baseUrl: '',
      customDocs: false
    },
    ssl: {
      enabled: true,
      autoRenew: true,
      provider: 'letsencrypt'
    },
    analytics: {
      enabled: false
    },
    branding: {
      hideAxieStudioBranding: false
    }
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = () => {
    const allTenants = getAllTenants();
    setTenants(allTenants);
  };

  const handleAddTenant = () => {
    if (!formData.name || !formData.domain) {
      alert('Name and domain are required');
      return;
    }

    const newTenant: TenantConfig = {
      id: formData.domain?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || '',
      name: formData.name || '',
      domain: formData.domain || '',
      customDomain: formData.customDomain,
      logo: formData.logo || '/default-logo.png',
      primaryColor: formData.primaryColor || '#f59e0b',
      secondaryColor: formData.secondaryColor || '#1f2937',
      favicon: `/favicons/${formData.domain}-favicon.ico`,
      tier: formData.tier || 'basic',
      features: {
        signup: formData.features?.signup || false,
        marketplace: formData.features?.marketplace || true,
        customComponents: formData.features?.customComponents || true,
        customDomain: formData.features?.customDomain || false,
        sso: formData.features?.sso || false,
        whiteLabel: formData.features?.whiteLabel || false
      },
      contact: {
        email: formData.contact?.email || '',
        website: formData.contact?.website || '',
        support: formData.contact?.support || '',
        phone: formData.contact?.phone
      },
      documentation: {
        baseUrl: formData.documentation?.baseUrl || '',
        customDocs: formData.documentation?.customDocs || false
      },
      ssl: {
        enabled: formData.ssl?.enabled || true,
        autoRenew: formData.ssl?.autoRenew || true,
        provider: formData.ssl?.provider || 'letsencrypt'
      },
      analytics: {
        enabled: formData.analytics?.enabled || false,
        googleAnalytics: formData.analytics?.googleAnalytics,
        customTracking: formData.analytics?.customTracking
      },
      branding: {
        hideAxieStudioBranding: formData.branding?.hideAxieStudioBranding || false,
        customFooter: formData.branding?.customFooter,
        customTermsUrl: formData.branding?.customTermsUrl,
        customPrivacyUrl: formData.branding?.customPrivacyUrl
      }
    };

    addTenant(newTenant);
    setFormData({});
    setShowAddForm(false);
    loadTenants();
  };

  const handleUpdateTenant = () => {
    if (!editingTenant) return;

    updateTenant(editingTenant.domain, formData);
    setEditingTenant(null);
    setFormData({});
    loadTenants();
  };

  const handleDeleteTenant = (domain: string, name: string) => {
    if (domain === 'axiestudio.com') {
      alert('Cannot delete the main Axie Studio tenant');
      return;
    }

    if (confirm(`Are you sure you want to delete tenant "${name}"?`)) {
      removeTenant(domain);
      loadTenants();
    }
  };

  const startEditTenant = (tenant: TenantConfig) => {
    setEditingTenant(tenant);
    setFormData(tenant);
  };

  const toggleWhiteLabel = (tenantDomain: string, currentStatus: boolean) => {
    const updatedTenants = tenants.map(tenant => {
      if (tenant.domain === tenantDomain) {
        return {
          ...tenant,
          features: {
            ...tenant.features,
            whiteLabel: !currentStatus
          }
        };
      }
      return tenant;
    });
    setTenants(updatedTenants);

    // In production, this would call the API
    console.log(`White-label ${!currentStatus ? 'enabled' : 'disabled'} for ${tenantDomain}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Multi-Tenant Management
        </h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Manage white-label instances with custom branding and domains.
        </p>
      </div>

      {/* Add Tenant Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add New Tenant'}
        </button>
      </div>

      {/* Add Tenant Form */}
      {showAddForm && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#f0f9ff'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Add New Tenant
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Tenant Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company AI Studio"
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
                Domain
              </label>
              <input
                type="text"
                value={formData.domain || ''}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="client.axiestudio.com"
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
                type="text"
                value={formData.logo || ''}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://client.com/logo.png"
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
                Primary Color
              </label>
              <input
                type="color"
                value={formData.primaryColor || '#f59e0b'}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
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
                Support Email
              </label>
              <input
                type="email"
                value={formData.contact?.support || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact: { ...formData.contact, support: e.target.value } as any
                })}
                placeholder="support@client.com"
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
                Website
              </label>
              <input
                type="url"
                value={formData.contact?.website || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, website: e.target.value } as any
                })}
                placeholder="https://client.com"
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
                Custom Domain
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={formData.customDomain || ''}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  placeholder="ai.client.com (optional)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => alert('Custom domains available! Contact stefan@axiestudio.se for setup.')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Contact Us
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Leave empty for subdomain (client.axiestudio.com)
              </div>
            </div>
          </div>

          {/* White-Label Toggle Section */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
              🎨 White-Label Settings (Admin Control)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.features?.whiteLabel || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: {
                        ...formData.features,
                        whiteLabel: e.target.checked,
                        signup: formData.features?.signup || false,
                        marketplace: formData.features?.marketplace || true,
                        customComponents: formData.features?.customComponents || true,
                        customDomain: formData.features?.customDomain || false,
                        sso: formData.features?.sso || false
                      }
                    })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: '500' }}>Enable White-Label</span>
                </label>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
                  Allow user to customize branding
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.branding?.hideAxieStudioBranding || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      branding: {
                        ...formData.branding,
                        hideAxieStudioBranding: e.target.checked
                      }
                    })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: '500' }}>Hide Axie Studio Branding</span>
                </label>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
                  Remove "Powered by Axie Studio"
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '12px', fontStyle: 'italic' }}>
              💡 White-label features are only available when "Enable White-Label" is checked by admin
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={handleAddTenant}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create Tenant
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tenant</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Domain</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Branding</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Features</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={tenant.logo} 
                      alt={tenant.name}
                      style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.src = '/default-logo.png';
                      }}
                    />
                    <span style={{ fontWeight: '500' }}>{tenant.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace' }}>
                  {tenant.domain}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: tenant.primaryColor,
                      borderRadius: '4px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {tenant.primaryColor}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {tenant.features.signup && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: '11px',
                        borderRadius: '4px'
                      }}>
                        Signup
                      </span>
                    )}
                    {tenant.features.marketplace && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        fontSize: '11px',
                        borderRadius: '4px'
                      }}>
                        Store
                      </span>
                    )}
                    {tenant.features.customComponents && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: '11px',
                        borderRadius: '4px'
                      }}>
                        Custom
                      </span>
                    )}
                    {tenant.features.whiteLabel && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        fontSize: '11px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        White-Label
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => window.open(`https://${tenant.domain}`, '_blank')}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Visit
                    </button>
                    
                    <button
                      onClick={() => startEditTenant(tenant)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleWhiteLabel(tenant.domain, tenant.features.whiteLabel)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: tenant.features.whiteLabel ? '#7c3aed' : '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title={tenant.features.whiteLabel ? 'Disable White-Label' : 'Enable White-Label'}
                    >
                      {tenant.features.whiteLabel ? 'WL ON' : 'WL OFF'}
                    </button>

                    {tenant.domain !== 'axiestudio.com' && (
                      <button
                        onClick={() => handleDeleteTenant(tenant.domain, tenant.name)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Business Opportunity Info */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#0c4a6e' }}>
          💰 Multi-Tenant Business Opportunities
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c4a6e' }}>
          <li><strong>White-label Reseller Program</strong> - Sell branded instances to agencies</li>
          <li><strong>Enterprise Custom Domains</strong> - client.theircompany.com ($500+/month)</li>
          <li><strong>Agency Partnerships</strong> - They sell, you provide the platform (revenue share)</li>
          <li><strong>Custom Branding Premium</strong> - Charge extra for full customization</li>
        </ul>
      </div>
    </div>
  );
}
