// User Storage Service for Axie Studio
// This service manages users in a way that can be easily deployed and managed

import { AxieStudioUser } from '../controllers/API/queries/admin/user-management';

export class UserStorageService {
  private static instance: UserStorageService;
  private users: Map<string, AxieStudioUser> = new Map();
  private storageKey = 'axie-studio-users';

  private constructor() {
    this.loadUsers();
  }

  public static getInstance(): UserStorageService {
    if (!UserStorageService.instance) {
      UserStorageService.instance = new UserStorageService();
    }
    return UserStorageService.instance;
  }

  // Load users from localStorage and environment variables
  private loadUsers(): void {
    // First, load from environment variables (initial setup)
    this.loadFromEnvironment();
    
    // Then, load any additional users from localStorage (runtime additions)
    this.loadFromLocalStorage();
  }

  private loadFromEnvironment(): void {
    // Load superuser
    const superuser = process.env.AXIE_STUDIO_SUPERUSER || 'admin';
    const superuserPassword = process.env.AXIE_STUDIO_SUPERUSER_PASSWORD || 'admin123';
    
    const superuserData: AxieStudioUser = {
      id: 'superuser-1',
      username: superuser,
      password: superuserPassword,
      role: 'superuser',
      active: true,
      createdAt: new Date().toISOString()
    };
    
    this.users.set(superuserData.id, superuserData);

    // Load additional users from environment
    const envUsers = process.env.AXIE_STUDIO_USERS;
    if (envUsers) {
      const userEntries = envUsers.split(',');
      userEntries.forEach((entry, index) => {
        const [username, password, role = 'user'] = entry.split(':');
        if (username && password) {
          const userData: AxieStudioUser = {
            id: `env-user-${index + 1}`,
            username: username.trim(),
            password: password.trim(),
            role: role.trim() as 'superuser' | 'user',
            active: true,
            createdAt: new Date().toISOString()
          };
          this.users.set(userData.id, userData);
        }
      });
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const storedUsers: AxieStudioUser[] = JSON.parse(stored);
        storedUsers.forEach(user => {
          // Only add if not already exists (environment users take precedence)
          if (!Array.from(this.users.values()).some(u => u.username === user.username)) {
            this.users.set(user.id, user);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      // Only save non-environment users to localStorage
      const runtimeUsers = Array.from(this.users.values()).filter(
        user => !user.id.startsWith('superuser-') && !user.id.startsWith('env-user-')
      );
      localStorage.setItem(this.storageKey, JSON.stringify(runtimeUsers));
    } catch (error) {
      console.error('Failed to save users to localStorage:', error);
    }
  }

  // CRUD Operations
  public getAllUsers(): AxieStudioUser[] {
    return Array.from(this.users.values());
  }

  public getUserById(id: string): AxieStudioUser | undefined {
    return this.users.get(id);
  }

  public getUserByUsername(username: string): AxieStudioUser | undefined {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  public createUser(userData: Omit<AxieStudioUser, 'id' | 'createdAt'>): AxieStudioUser {
    // Check if username already exists
    if (this.getUserByUsername(userData.username)) {
      throw new Error('Username already exists');
    }

    const newUser: AxieStudioUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    this.users.set(newUser.id, newUser);
    this.saveToLocalStorage();
    
    return newUser;
  }

  public updateUser(id: string, updates: Partial<AxieStudioUser>): AxieStudioUser {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if username is being changed and if it conflicts
    if (updates.username && updates.username !== user.username) {
      const existingUser = this.getUserByUsername(updates.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Username already exists');
      }
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    this.saveToLocalStorage();
    
    return updatedUser;
  }

  public deleteUser(id: string): boolean {
    // Prevent deletion of environment users
    if (id.startsWith('superuser-') || id.startsWith('env-user-')) {
      throw new Error('Cannot delete environment-configured users');
    }

    const deleted = this.users.delete(id);
    if (deleted) {
      this.saveToLocalStorage();
    }
    
    return deleted;
  }

  public validateCredentials(username: string, password: string): AxieStudioUser | null {
    const user = this.getUserByUsername(username);
    if (user && user.password === password && user.active) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      this.users.set(user.id, user);
      this.saveToLocalStorage();
      return user;
    }
    return null;
  }

  public updateLastLogin(username: string): void {
    const user = this.getUserByUsername(username);
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.users.set(user.id, user);
      this.saveToLocalStorage();
    }
  }

  // Utility methods
  public getUserStats(): {
    total: number;
    active: number;
    superusers: number;
    environmentUsers: number;
    runtimeUsers: number;
  } {
    const users = this.getAllUsers();
    return {
      total: users.length,
      active: users.filter(u => u.active).length,
      superusers: users.filter(u => u.role === 'superuser').length,
      environmentUsers: users.filter(u => u.id.startsWith('superuser-') || u.id.startsWith('env-user-')).length,
      runtimeUsers: users.filter(u => !u.id.startsWith('superuser-') && !u.id.startsWith('env-user-')).length
    };
  }

  public exportUsers(): string {
    const users = this.getAllUsers();
    return JSON.stringify(users, null, 2);
  }

  public importUsers(jsonData: string): number {
    try {
      const importedUsers: AxieStudioUser[] = JSON.parse(jsonData);
      let imported = 0;
      
      importedUsers.forEach(user => {
        try {
          // Skip if username already exists
          if (!this.getUserByUsername(user.username)) {
            this.createUser({
              username: user.username,
              password: user.password,
              role: user.role,
              active: user.active
            });
            imported++;
          }
        } catch (error) {
          console.warn(`Failed to import user ${user.username}:`, error);
        }
      });
      
      return imported;
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }
}

// Export singleton instance
export const userStorage = UserStorageService.getInstance();
