import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { getURL } from '../../helpers/constants';

export interface AxieStudioUser {
  id: string;
  username: string;
  password: string;
  role: 'superuser' | 'user';
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'superuser' | 'user';
  active: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: 'superuser' | 'user';
  active?: boolean;
}

// Get all users
export const useGetAxieStudioUsers = () => {
  return useQuery({
    queryKey: ['axie-studio-users'],
    queryFn: async (): Promise<AxieStudioUser[]> => {
      const response = await api.get(`${getURL('ADMIN')}/users`);
      return response.data;
    },
  });
};

// Create user
export const useCreateAxieStudioUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: CreateUserRequest): Promise<AxieStudioUser> => {
      const response = await api.post(`${getURL('ADMIN')}/users`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['axie-studio-users'] });
    },
  });
};

// Update user
export const useUpdateAxieStudioUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: UpdateUserRequest }): Promise<AxieStudioUser> => {
      const response = await api.put(`${getURL('ADMIN')}/users/${id}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['axie-studio-users'] });
    },
  });
};

// Delete user
export const useDeleteAxieStudioUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`${getURL('ADMIN')}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['axie-studio-users'] });
    },
  });
};

// Generate password
export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Validate user data
export const validateUserData = (userData: CreateUserRequest | UpdateUserRequest): string[] => {
  const errors: string[] = [];
  
  if ('username' in userData && userData.username) {
    if (userData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(userData.username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
  }
  
  if ('password' in userData && userData.password) {
    if (userData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
  }
  
  return errors;
};

// Export user credentials for email
export const exportUserCredentials = (user: AxieStudioUser): string => {
  const baseUrl = window.location.origin;
  
  return `
Axie Studio Access Credentials

Username: ${user.username}
Password: ${user.password}
Login URL: ${baseUrl}
Role: ${user.role}

Please keep these credentials secure and do not share them with others.

If you have any questions, please contact support.

Best regards,
The Axie Studio Team
  `.trim();
};

// Generate email template
export const generateEmailTemplate = (user: AxieStudioUser): { subject: string; body: string } => {
  const baseUrl = window.location.origin;
  
  return {
    subject: 'Your Axie Studio Access Credentials',
    body: `Dear Customer,

Welcome to Axie Studio! Your account has been created successfully.

Login Details:
• Website: ${baseUrl}
• Username: ${user.username}
• Password: ${user.password}
• Role: ${user.role}

Getting Started:
1. Visit ${baseUrl}
2. Enter your username and password
3. Start building your AI flows!

Security Notice:
Please keep these credentials secure and do not share them with others. If you suspect your account has been compromised, please contact our support team immediately.

Support:
If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Best regards,
The Axie Studio Team

---
This is an automated message. Please do not reply to this email.`
  };
};
