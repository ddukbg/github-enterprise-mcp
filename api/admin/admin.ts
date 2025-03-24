import { GitHubClient } from '../../utils/client.js';
import {
  GitHubLicenseInfo,
  GitHubEnterpriseUser,
  GitHubEnterpriseStats,
  GitHubSecurityPolicy,
  GitHubMaintenance,
  GitHubBackupStatus
} from './types.js';

/**
 * Class providing GitHub Enterprise Server administrator features
 * This API is only available on GitHub Enterprise Server
 */
export class AdminAPI {
  private client: GitHubClient;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  /**
   * Retrieve license information
   * GitHub Enterprise Server exclusive API
   */
  async getLicenseInfo(): Promise<GitHubLicenseInfo> {
    return this.client.get<GitHubLicenseInfo>('enterprise/settings/license');
  }

  /**
   * List enterprise users
   * GitHub Enterprise Server exclusive API
   */
  async listUsers(page = 1, perPage = 30): Promise<GitHubEnterpriseUser[]> {
    return this.client.get<GitHubEnterpriseUser[]>('admin/users', {
      params: {
        page,
        per_page: perPage
      }
    });
  }

  /**
   * Get specific user
   * GitHub Enterprise Server exclusive API
   */
  async getUser(username: string): Promise<GitHubEnterpriseUser> {
    return this.client.get<GitHubEnterpriseUser>(`admin/users/${username}`);
  }

  /**
   * Create new user
   * GitHub Enterprise Server exclusive API
   */
  async createUser(
    login: string,
    email: string,
    options: {
      name?: string;
      password?: string;
    } = {}
  ): Promise<GitHubEnterpriseUser> {
    return this.client.post<GitHubEnterpriseUser>('admin/users', {
      login,
      email,
      ...options
    });
  }

  /**
   * Suspend user
   * GitHub Enterprise Server exclusive API
   */
  async suspendUser(username: string, reason?: string): Promise<void> {
    await this.client.put(`admin/users/${username}/suspended`, {
      reason
    });
  }

  /**
   * Unsuspend user
   * GitHub Enterprise Server exclusive API
   */
  async unsuspendUser(username: string): Promise<void> {
    await this.client.delete(`admin/users/${username}/suspended`);
  }

  /**
   * Get enterprise statistics
   * GitHub Enterprise Server exclusive API
   */
  async getStats(): Promise<GitHubEnterpriseStats> {
    return this.client.get<GitHubEnterpriseStats>('enterprise/stats/all');
  }

  /**
   * List security policies
   * GitHub Enterprise Server exclusive API
   */
  async listSecurityPolicies(): Promise<GitHubSecurityPolicy[]> {
    return this.client.get<GitHubSecurityPolicy[]>('enterprise/settings/security');
  }

  /**
   * Enable/disable security policy
   * GitHub Enterprise Server exclusive API
   */
  async updateSecurityPolicy(id: number, enabled: boolean): Promise<GitHubSecurityPolicy> {
    return this.client.patch<GitHubSecurityPolicy>(`enterprise/settings/security/${id}`, {
      enabled
    });
  }

  /**
   * Get maintenance mode status
   * GitHub Enterprise Server exclusive API
   */
  async getMaintenanceStatus(): Promise<GitHubMaintenance> {
    return this.client.get<GitHubMaintenance>('enterprise/maintenance');
  }

  /**
   * Enable maintenance mode
   * GitHub Enterprise Server exclusive API
   */
  async enableMaintenance(scheduledTime?: string): Promise<GitHubMaintenance> {
    return this.client.put<GitHubMaintenance>('enterprise/maintenance', {
      enabled: true,
      scheduled_at: scheduledTime
    });
  }

  /**
   * Disable maintenance mode
   * GitHub Enterprise Server exclusive API
   */
  async disableMaintenance(): Promise<GitHubMaintenance> {
    return this.client.put<GitHubMaintenance>('enterprise/maintenance', {
      enabled: false
    });
  }

  /**
   * Get backup status
   * GitHub Enterprise Server exclusive API
   */
  async getBackupStatus(): Promise<GitHubBackupStatus> {
    return this.client.get<GitHubBackupStatus>('enterprise/backup');
  }

  /**
   * Enable backup
   * GitHub Enterprise Server exclusive API
   */
  async enableBackup(): Promise<GitHubBackupStatus> {
    return this.client.put<GitHubBackupStatus>('enterprise/backup', {
      backup_enabled: true
    });
  }

  /**
   * Disable backup
   * GitHub Enterprise Server exclusive API
   */
  async disableBackup(): Promise<GitHubBackupStatus> {
    return this.client.put<GitHubBackupStatus>('enterprise/backup', {
      backup_enabled: false
    });
  }
} 