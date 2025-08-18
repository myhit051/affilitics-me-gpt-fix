// User management for team usage
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst';
  avatar?: string;
  facebookAccounts: string[];
  permissions: Permission[];
  lastLogin: Date;
  createdAt: Date;
}

export interface Permission {
  resource: 'campaigns' | 'accounts' | 'reports' | 'settings';
  actions: ('read' | 'write' | 'delete')[];
}

export interface Team {
  id: string;
  name: string;
  members: User[];
  settings: TeamSettings;
}

export interface TeamSettings {
  defaultSyncInterval: number;
  allowedDomains: string[];
  dataRetentionDays: number;
  requireApprovalForNewAccounts: boolean;
}

class UserManager {
  private currentUser: User | null = null;
  private team: Team | null = null;

  // Initialize user from localStorage or session
  init() {
    const userData = localStorage.getItem('affilitics_user');
    const teamData = localStorage.getItem('affilitics_team');
    
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
    if (teamData) {
      this.team = JSON.parse(teamData);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Set current user (after Facebook login)
  setCurrentUser(facebookUser: any) {
    const user: User = {
      id: facebookUser.id,
      name: facebookUser.name,
      email: facebookUser.email,
      role: this.determineUserRole(facebookUser.email),
      avatar: facebookUser.picture?.data?.url,
      facebookAccounts: [],
      permissions: this.getDefaultPermissions('analyst'),
      lastLogin: new Date(),
      createdAt: new Date(),
    };

    this.currentUser = user;
    localStorage.setItem('affilitics_user', JSON.stringify(user));
    
    return user;
  }

  // Determine user role based on email domain or predefined list
  private determineUserRole(email: string): 'admin' | 'manager' | 'analyst' {
    const adminEmails = ['admin@yourcompany.com']; // Configure this
    const managerEmails = ['manager@yourcompany.com']; // Configure this
    
    if (adminEmails.includes(email)) return 'admin';
    if (managerEmails.includes(email)) return 'manager';
    return 'analyst';
  }

  // Get default permissions for role
  private getDefaultPermissions(role: 'admin' | 'manager' | 'analyst'): Permission[] {
    const permissions: Record<string, Permission[]> = {
      admin: [
        { resource: 'campaigns', actions: ['read', 'write', 'delete'] },
        { resource: 'accounts', actions: ['read', 'write', 'delete'] },
        { resource: 'reports', actions: ['read', 'write', 'delete'] },
        { resource: 'settings', actions: ['read', 'write', 'delete'] },
      ],
      manager: [
        { resource: 'campaigns', actions: ['read', 'write'] },
        { resource: 'accounts', actions: ['read', 'write'] },
        { resource: 'reports', actions: ['read', 'write'] },
        { resource: 'settings', actions: ['read'] },
      ],
      analyst: [
        { resource: 'campaigns', actions: ['read'] },
        { resource: 'accounts', actions: ['read'] },
        { resource: 'reports', actions: ['read', 'write'] },
        { resource: 'settings', actions: ['read'] },
      ],
    };

    return permissions[role] || permissions.analyst;
  }

  // Check if user has permission
  hasPermission(resource: string, action: string): boolean {
    if (!this.currentUser) return false;

    const permission = this.currentUser.permissions.find(p => p.resource === resource);
    return permission?.actions.includes(action as any) || false;
  }

  // Update user's Facebook accounts
  updateFacebookAccounts(accounts: string[]) {
    if (this.currentUser) {
      this.currentUser.facebookAccounts = accounts;
      localStorage.setItem('affilitics_user', JSON.stringify(this.currentUser));
    }
  }

  // Logout user
  logout() {
    this.currentUser = null;
    this.team = null;
    localStorage.removeItem('affilitics_user');
    localStorage.removeItem('affilitics_team');
    localStorage.removeItem('facebook_token');
  }

  // Get team info
  getTeam(): Team | null {
    return this.team;
  }
}

export const userManager = new UserManager();