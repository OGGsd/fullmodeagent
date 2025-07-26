// Backend-Integrated User Management for Axie Studio
// This service properly integrates with the backend user system for complete isolation

import { robustMiddleman } from './robust-middleman';

export interface BackendUser {
  id: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  create_at: string;
  updated_at: string;
  last_login_at: string | null;
  profile_image: string | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  is_superuser?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export class BackendUserManagementService {
  
  // Create user in backend (proper isolation)
  async createUser(userData: CreateUserRequest): Promise<BackendUser> {
    try {
      const response = await robustMiddleman.post('/api/v1/users/', {
        username: userData.username,
        password: userData.password,
        optins: {
          github_starred: false,
          dialog_dismissed: false,
          discord_clicked: false
        }
      });

      // If we need to make them superuser, update after creation
      if (userData.is_superuser) {
        await this.updateUser(response.id, { is_superuser: true });
        response.is_superuser = true;
      }

      return response;
    } catch (error: any) {
      if (error.message?.includes('unavailable')) {
        throw new Error('Username already exists. Please choose a different username.');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Get all users from backend
  async getUsers(): Promise<BackendUser[]> {
    try {
      const response = await robustMiddleman.get('/api/v1/users/');
      return response.users || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  // Get specific user by ID
  async getUser(userId: string): Promise<BackendUser> {
    try {
      return await robustMiddleman.get(`/api/v1/users/${userId}`);
    } catch (error: any) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  // Update user in backend
  async updateUser(userId: string, updates: UpdateUserRequest): Promise<BackendUser> {
    try {
      return await robustMiddleman.patch(`/api/v1/users/${userId}`, updates);
    } catch (error: any) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user from backend (removes all their data)
  async deleteUser(userId: string): Promise<void> {
    try {
      await robustMiddleman.delete(`/api/v1/users/${userId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Activate/Deactivate user
  async setUserActive(userId: string, isActive: boolean): Promise<BackendUser> {
    return this.updateUser(userId, { is_active: isActive });
  }

  // Make user superuser
  async setUserSuperuser(userId: string, isSuperuser: boolean): Promise<BackendUser> {
    return this.updateUser(userId, { is_superuser: isSuperuser });
  }

  // Reset user password
  async resetUserPassword(userId: string, newPassword: string): Promise<BackendUser> {
    return this.updateUser(userId, { password: newPassword });
  }

  // Get user's flows (workspace isolation check)
  async getUserFlows(userId: string): Promise<any[]> {
    try {
      // This should only return flows owned by this specific user
      const response = await robustMiddleman.get(`/api/v1/flows/?user_id=${userId}`);
      return response.flows || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch user flows: ${error.message}`);
    }
  }

  // Get user's folders (workspace isolation check)
  async getUserFolders(userId: string): Promise<any[]> {
    try {
      // This should only return folders owned by this specific user
      const response = await robustMiddleman.get(`/api/v1/folders/?user_id=${userId}`);
      return response.folders || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch user folders: ${error.message}`);
    }
  }

  // Get user's variables (workspace isolation check)
  async getUserVariables(userId: string): Promise<any[]> {
    try {
      // This should only return variables owned by this specific user
      const response = await robustMiddleman.get(`/api/v1/variables/?user_id=${userId}`);
      return response.variables || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch user variables: ${error.message}`);
    }
  }

  // Verify user isolation (admin function)
  async verifyUserIsolation(userId1: string, userId2: string): Promise<{
    isolated: boolean;
    sharedResources: string[];
  }> {
    try {
      const [user1Flows, user2Flows] = await Promise.all([
        this.getUserFlows(userId1),
        this.getUserFlows(userId2)
      ]);

      const [user1Folders, user2Folders] = await Promise.all([
        this.getUserFolders(userId1),
        this.getUserFolders(userId2)
      ]);

      const [user1Variables, user2Variables] = await Promise.all([
        this.getUserVariables(userId1),
        this.getUserVariables(userId2)
      ]);

      const sharedResources: string[] = [];

      // Check for shared flows (should be none)
      const sharedFlows = user1Flows.filter(flow1 => 
        user2Flows.some(flow2 => flow1.id === flow2.id)
      );
      if (sharedFlows.length > 0) {
        sharedResources.push(`${sharedFlows.length} shared flows`);
      }

      // Check for shared folders (should be none)
      const sharedFolders = user1Folders.filter(folder1 => 
        user2Folders.some(folder2 => folder1.id === folder2.id)
      );
      if (sharedFolders.length > 0) {
        sharedResources.push(`${sharedFolders.length} shared folders`);
      }

      // Check for shared variables (should be none)
      const sharedVariables = user1Variables.filter(var1 => 
        user2Variables.some(var2 => var1.id === var2.id)
      );
      if (sharedVariables.length > 0) {
        sharedResources.push(`${sharedVariables.length} shared variables`);
      }

      return {
        isolated: sharedResources.length === 0,
        sharedResources
      };
    } catch (error: any) {
      throw new Error(`Failed to verify user isolation: ${error.message}`);
    }
  }

  // Get user statistics (for admin dashboard)
  async getUserStats(userId: string): Promise<{
    flowCount: number;
    folderCount: number;
    variableCount: number;
    lastLogin: string | null;
    isActive: boolean;
  }> {
    try {
      const [user, flows, folders, variables] = await Promise.all([
        this.getUser(userId),
        this.getUserFlows(userId),
        this.getUserFolders(userId),
        this.getUserVariables(userId)
      ]);

      return {
        flowCount: flows.length,
        folderCount: folders.length,
        variableCount: variables.length,
        lastLogin: user.last_login_at,
        isActive: user.is_active
      };
    } catch (error: any) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  // Authenticate user with backend
  async authenticateUser(username: string, password: string): Promise<{
    user: BackendUser;
    tokens: {
      access_token: string;
      refresh_token: string;
      token_type: string;
    };
  }> {
    try {
      const response = await robustMiddleman.post('/api/v1/login', 
        new URLSearchParams({
          username,
          password
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Get user details
      const userResponse = await robustMiddleman.get('/api/v1/users/whoami');

      return {
        user: userResponse,
        tokens: response
      };
    } catch (error: any) {
      if (error.message?.includes('401')) {
        throw new Error('Invalid username or password');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Check if current user is superuser
  async getCurrentUser(): Promise<BackendUser> {
    try {
      return await robustMiddleman.get('/api/v1/users/whoami');
    } catch (error: any) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }

  // Generate secure password
  generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

// Singleton instance
export const backendUserManager = new BackendUserManagementService();
