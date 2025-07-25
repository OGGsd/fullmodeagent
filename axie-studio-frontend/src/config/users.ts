// Environment-based user configuration for Axie Studio
export interface AxieStudioUser {
  username: string;
  password: string;
  role: 'superuser' | 'user';
  active: boolean;
}

// Parse environment variables for user configuration
const parseEnvUsers = (): AxieStudioUser[] => {
  const users: AxieStudioUser[] = [];
  
  // Default superuser
  const superuser = process.env.AXIE_STUDIO_SUPERUSER || 'stefan@axiestudio.se';
  const superuserPassword = process.env.AXIE_STUDIO_SUPERUSER_PASSWORD || 'STEfanjohn!12';
  
  users.push({
    username: superuser,
    password: superuserPassword,
    role: 'superuser',
    active: true
  });
  
  // Parse additional users from environment
  // Format: AXIE_STUDIO_USERS=user1:pass1:user,user2:pass2:user,user3:pass3:superuser
  const envUsers = process.env.AXIE_STUDIO_USERS;
  if (envUsers) {
    const userEntries = envUsers.split(',');
    userEntries.forEach(entry => {
      const [username, password, role = 'user'] = entry.split(':');
      if (username && password) {
        users.push({
          username: username.trim(),
          password: password.trim(),
          role: role.trim() as 'superuser' | 'user',
          active: true
        });
      }
    });
  }
  
  return users;
};

export const AXIE_STUDIO_USERS = parseEnvUsers();

// Helper function to validate user credentials
export const validateUser = (username: string, password: string): AxieStudioUser | null => {
  // First check environment users
  const envUser = AXIE_STUDIO_USERS.find(u =>
    u.username === username &&
    u.password === password &&
    u.active
  );

  if (envUser) {
    return envUser;
  }

  // Then check localStorage users
  try {
    const stored = localStorage.getItem('axie-studio-users');
    if (stored) {
      const storedUsers: AxieStudioUser[] = JSON.parse(stored);
      const storedUser = storedUsers.find(u =>
        u.username === username &&
        u.password === password &&
        u.active
      );
      return storedUser || null;
    }
  } catch (error) {
    console.error('Error checking stored users:', error);
  }

  return null;
};

// Helper function to check if user is superuser
export const isSuperUser = (username: string): boolean => {
  const user = AXIE_STUDIO_USERS.find(u => u.username === username);
  return user?.role === 'superuser' || false;
};
