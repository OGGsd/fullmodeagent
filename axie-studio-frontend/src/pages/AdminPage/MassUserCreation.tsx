import React, { useState } from 'react';
import { backendUserManager } from '../../services/backend-user-management';

interface BulkUser {
  username: string;
  password: string;
  tenant?: string;
  status: 'pending' | 'created' | 'failed';
  error?: string;
}

export default function MassUserCreation() {
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [userCount, setUserCount] = useState(10);
  const [tenantPrefix, setTenantPrefix] = useState('client');
  const [emailDomain, setEmailDomain] = useState('example.com');

  // Generate bulk users
  const generateBulkUsers = () => {
    const users: BulkUser[] = [];
    
    for (let i = 1; i <= userCount; i++) {
      const username = `user${i.toString().padStart(3, '0')}@${emailDomain}`;
      const password = backendUserManager.generateSecurePassword(12);
      const tenant = `${tenantPrefix}${i.toString().padStart(2, '0')}`;
      
      users.push({
        username,
        password,
        tenant,
        status: 'pending'
      });
    }
    
    setBulkUsers(users);
  };

  // Create all users
  const createAllUsers = async () => {
    setIsCreating(true);
    
    for (let i = 0; i < bulkUsers.length; i++) {
      const user = bulkUsers[i];
      
      try {
        await backendUserManager.createUser({
          username: user.username,
          password: user.password,
          is_superuser: false
        });
        
        // Update status
        setBulkUsers(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'created' as const } : u
        ));
        
        // Small delay to avoid overwhelming the backend
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        setBulkUsers(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'failed' as const, error: error.message } : u
        ));
      }
    }
    
    setIsCreating(false);
  };

  // Export credentials to CSV
  const exportToCSV = () => {
    const csvContent = [
      'Username,Password,Tenant,Status',
      ...bulkUsers.map(user => 
        `${user.username},${user.password},${user.tenant},${user.status}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axie-studio-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Generate email template
  const generateEmailTemplate = (user: BulkUser) => {
    const subject = 'Your Axie Studio Account - Ready to Use!';
    const body = `Hello!

Your Axie Studio account has been created and is ready to use.

🔐 Login Details:
• Website: https://${user.tenant}.axiestudio.com
• Username: ${user.username}
• Password: ${user.password}

🚀 Getting Started:
1. Click the link above to access your AI platform
2. Log in with your credentials
3. Start building powerful AI workflows
4. Explore our pre-loaded templates

Need help? Reply to this email or contact support@axiestudio.se

Best regards,
The Axie Studio Team

---
Powered by Axie Studio - Professional AI Workflow Platform`;

    const mailtoLink = `mailto:${user.username}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const createdCount = bulkUsers.filter(u => u.status === 'created').length;
  const failedCount = bulkUsers.filter(u => u.status === 'failed').length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Mass User Creation
        </h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Generate and create multiple users for your Axie Studio platform. Perfect for pre-configuring accounts before sales.
        </p>
      </div>

      {/* Configuration */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Bulk User Configuration
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Number of Users
            </label>
            <input
              type="number"
              value={userCount}
              onChange={(e) => setUserCount(parseInt(e.target.value) || 10)}
              min="1"
              max="100"
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
              Tenant Prefix
            </label>
            <input
              type="text"
              value={tenantPrefix}
              onChange={(e) => setTenantPrefix(e.target.value)}
              placeholder="client"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              Will create: {tenantPrefix}01.axiestudio.com, {tenantPrefix}02.axiestudio.com, etc.
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Email Domain
            </label>
            <input
              type="text"
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value)}
              placeholder="example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              Will create: user001@{emailDomain}, user002@{emailDomain}, etc.
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={generateBulkUsers}
            disabled={isCreating}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.6 : 1
            }}
          >
            Generate User List
          </button>
          
          {bulkUsers.length > 0 && (
            <>
              <button
                onClick={createAllUsers}
                disabled={isCreating}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : 1
                }}
              >
                {isCreating ? 'Creating Users...' : 'Create All Users'}
              </button>
              
              <button
                onClick={exportToCSV}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      {bulkUsers.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {bulkUsers.length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Users</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {createdCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Created</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              {failedCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Failed</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {bulkUsers.length - createdCount - failedCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Pending</div>
          </div>
        </div>
      )}

      {/* User List */}
      {bulkUsers.length > 0 && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'white',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Generated Users</h3>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Username</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Password</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Tenant</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulkUsers.map((user, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace' }}>
                      {user.username}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace' }}>
                      {user.password}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '13px' }}>
                      <a 
                        href={`https://${user.tenant}.axiestudio.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {user.tenant}.axiestudio.com
                      </a>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: 
                          user.status === 'created' ? '#dcfce7' :
                          user.status === 'failed' ? '#fee2e2' : '#fef3c7',
                        color: 
                          user.status === 'created' ? '#166534' :
                          user.status === 'failed' ? '#dc2626' : '#92400e'
                      }}>
                        {user.status.toUpperCase()}
                      </span>
                      {user.error && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                          {user.error}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {user.status === 'created' && (
                        <button
                          onClick={() => generateEmailTemplate(user)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Email
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business Strategy Info */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#0c4a6e' }}>
          💡 Mass Production Strategy
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c4a6e' }}>
          <li><strong>Pre-configure accounts</strong> - Create users before you have customers</li>
          <li><strong>Instant delivery</strong> - Send credentials immediately after purchase</li>
          <li><strong>Professional appearance</strong> - Each user gets their own subdomain</li>
          <li><strong>Scalable process</strong> - Generate 100 users in minutes</li>
          <li><strong>CSV export</strong> - Easy integration with your sales process</li>
        </ul>
      </div>
    </div>
  );
}
