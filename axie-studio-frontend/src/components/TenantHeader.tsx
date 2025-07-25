import React, { useEffect, useState } from 'react';
import { getCurrentTenant, type TenantConfig } from '../config/tenant-config';

export default function TenantHeader() {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);

  useEffect(() => {
    const currentTenant = getCurrentTenant();
    setTenant(currentTenant);
  }, []);

  if (!tenant) {
    return null;
  }

  return (
    <header style={{
      backgroundColor: tenant.primaryColor,
      color: 'white',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Logo and Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src={tenant.logo} 
          alt={`${tenant.name} Logo`}
          style={{ height: '32px', width: 'auto' }}
          onError={(e) => {
            // Fallback to text if logo fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          margin: 0,
          color: 'white'
        }}>
          {tenant.name}
        </h1>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <a 
          href="/flows" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Workflows
        </a>
        
        {tenant.features.marketplace && (
          <a 
            href="/store" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Store
          </a>
        )}
        
        <a 
          href={tenant.documentation.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Docs
        </a>
        
        <a 
          href={`mailto:${tenant.contact.support}`}
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Support
        </a>
      </nav>

      {/* User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Profile
        </button>
        
        <button style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Logout
        </button>
      </div>
    </header>
  );
}
