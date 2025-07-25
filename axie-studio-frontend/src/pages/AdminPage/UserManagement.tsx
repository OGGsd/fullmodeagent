import React, { useState, useEffect } from 'react';

interface AxieStudioUser {
  id: string;
  username: string;
  password: string;
  role: 'superuser' | 'user';
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Simple user storage using localStorage
const userStorage = {
  getAllUsers: (): AxieStudioUser[] => {
    try {
      const stored = localStorage.getItem('axie-studio-users');
      if (stored) {
        return JSON.parse(stored);
      }
      // Return default admin user
      return [{
        id: '1',
        username: 'admin',
        password: 'admin123',
        role: 'superuser' as const,
        active: true,
        createdAt: new Date().toISOString()
      }];
    } catch {
      return [];
    }
  },

  saveUsers: (users: AxieStudioUser[]) => {
    localStorage.setItem('axie-studio-users', JSON.stringify(users));
  },

  createUser: (userData: Omit<AxieStudioUser, 'id' | 'createdAt'>): AxieStudioUser => {
    const newUser: AxieStudioUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    return newUser;
  }
};

export default function UserManagement() {
  const [users, setUsers] = useState<AxieStudioUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AxieStudioUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'user' | 'superuser',
    active: true
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = userStorage.getAllUsers();
    setUsers(allUsers);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleAddUser = () => {
    if (!formData.username || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    const newUser = userStorage.createUser(formData);
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    userStorage.saveUsers(updatedUsers);
    setFormData({ username: '', password: '', role: 'user', active: true });
    setShowAddForm(false);
    alert('User created successfully!');
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    const updatedUser = { ...editingUser, ...formData };
    const updatedUsers = users.map(u => u.id === editingUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    userStorage.saveUsers(updatedUsers);
    setEditingUser(null);
    alert('User updated successfully!');
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    userStorage.saveUsers(updatedUsers);
    alert('User deleted successfully!');
  };

  const copyCredentials = (user: AxieStudioUser) => {
    const credentials = `Username: ${user.username}\nPassword: ${user.password}\nLogin URL: ${window.location.origin}`;
    navigator.clipboard.writeText(credentials);
    alert('Credentials copied to clipboard!');
  };

  const openEmailTemplate = (user: AxieStudioUser) => {
    const subject = 'Your Axie Studio Access Credentials';
    const body = `Dear Customer,

Welcome to Axie Studio! Your account has been created successfully.

Login Details:
• Website: ${window.location.origin}
• Username: ${user.username}
• Password: ${user.password}

Please keep these credentials secure and do not share them with others.

Best regards,
The Axie Studio Team`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const startEdit = (user: AxieStudioUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      role: user.role,
      active: user.active
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          User Management
        </h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Manage Axie Studio user accounts
        </p>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Add New User
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
                placeholder="Enter username"
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
        backgroundColor: 'white'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            Users ({users.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Username</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Password</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{user.username}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                        {showPasswords[user.id] ? user.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        {showPasswords[user.id] ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: user.role === 'superuser' ? '#dbeafe' : '#f3f4f6',
                      color: user.role === 'superuser' ? '#1e40af' : '#374151'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: user.active ? '#dcfce7' : '#fee2e2',
                      color: user.active ? '#166534' : '#dc2626'
                    }}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => copyCredentials(user)}
                        title="Copy credentials"
                        style={{
                          background: 'none',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        📋
                      </button>
                      <button
                        onClick={() => openEmailTemplate(user)}
                        title="Send email"
                        style={{
                          background: 'none',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✉️
                      </button>
                      <button
                        onClick={() => startEdit(user)}
                        title="Edit user"
                        style={{
                          background: 'none',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                        style={{
                          background: 'none',
                          border: '1px solid #dc2626',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#dc2626'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Form */}
      {editingUser && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px',
          backgroundColor: '#fef3c7'
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
                placeholder="Enter username"
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
                onClick={handleEditUser}
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
      )}
    </div>
  );
}
