import React, { useState, useEffect } from 'react';
import { backendUserManager, type BackendUser } from '../../services/backend-user-management';

export default function BackendUserManagement() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'user' | 'superuser'
  });

  // Load users from backend
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const backendUsers = await backendUserManager.getUsers();
      setUsers(backendUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Generate secure password
  const generatePassword = () => {
    const newPassword = backendUserManager.generateSecurePassword();
    setFormData({ ...formData, password: newPassword });
  };

  // Add new user
  const handleAddUser = async () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    try {
      setError(null);
      await backendUserManager.createUser({
        username: formData.username,
        password: formData.password,
        is_superuser: formData.role === 'superuser'
      });
      
      setFormData({ username: '', password: '', role: 'user' });
      setShowAddForm(false);
      await loadUsers(); // Reload users
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setError(null);
      await backendUserManager.updateUser(editingUser.id, {
        username: formData.username,
        password: formData.password || undefined,
        is_superuser: formData.role === 'superuser'
      });
      
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'user' });
      await loadUsers(); // Reload users
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This will permanently delete all their workflows, folders, and data.`)) {
      return;
    }

    try {
      setError(null);
      await backendUserManager.deleteUser(userId);
      await loadUsers(); // Reload users
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Toggle user active status
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      setError(null);
      await backendUserManager.setUserActive(userId, !currentStatus);
      await loadUsers(); // Reload users
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  // Start editing user
  const startEditUser = (user: BackendUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password for security
      role: user.is_superuser ? 'superuser' : 'user'
    });
  };

  // Copy credentials to clipboard
  const copyCredentials = (username: string, password: string) => {
    const credentials = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
    alert('Credentials copied to clipboard!');
  };

  // Open email template
  const openEmailTemplate = (username: string, password: string) => {
    const subject = 'Your Axie Studio Account Credentials';
    const body = `Hello,

Your Axie Studio account has been created successfully!

Login Details:
• Website: ${window.location.origin}
• Username: ${username}
• Password: ${password}

You can now access the Axie Studio platform to build powerful AI workflows.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The Axie Studio Team`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>Loading users from backend...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Backend User Management
        </h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Manage users with complete workspace isolation. Each user has their own private workspace.
        </p>
        
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Add User Button */}
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
          {showAddForm ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#f0f9ff'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Add New User
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Username (Email recommended)
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="user@example.com"
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
                Password
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'superuser' })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="user">User</option>
                <option value="superuser">Superuser</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={handleAddUser}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Create User
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
        </div>
      )}

      {/* Users Table */}
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Last Login</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {user.username}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: user.is_superuser ? '#fef3c7' : '#e0f2fe',
                    color: user.is_superuser ? '#92400e' : '#0c4a6e'
                  }}>
                    {user.is_superuser ? 'Superuser' : 'User'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: user.is_active ? '#dcfce7' : '#fee2e2',
                    color: user.is_active ? '#166534' : '#dc2626'
                  }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => startEditUser(user)}
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
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: user.is_active ? '#f59e0b' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    
                    {!user.is_superuser && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
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

      {/* Edit User Form */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Edit User: {editingUser.username}
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                  New Password (leave empty to keep current)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Generate
                  </button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'superuser' })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="user">User</option>
                  <option value="superuser">Superuser</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={handleUpdateUser}
                  style={{
                    flex: 1,
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Update User
                </button>
                <button
                  onClick={() => setEditingUser(null)}
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
          </div>
        </div>
      )}
    </div>
  );
}
