import { GitHubClient } from '../../utils/client.js';
import { GitHubLicenseInfo, GitHubEnterpriseUser, GitHubEnterpriseStats, GitHubSecurityPolicy, GitHubMaintenance, GitHubBackupStatus } from './types.js';
/**
 * Class providing GitHub Enterprise Server administrator features
 * This API is only available on GitHub Enterprise Server
 */
export declare class AdminAPI {
    private client;
    constructor(client: GitHubClient);
    /**
     * Retrieve license information
     * GitHub Enterprise Server exclusive API
     */
    getLicenseInfo(): Promise<GitHubLicenseInfo>;
    /**
     * List enterprise users
     * GitHub Enterprise Server exclusive API
     */
    listUsers(page?: number, perPage?: number): Promise<GitHubEnterpriseUser[]>;
    /**
     * Get specific user
     * GitHub Enterprise Server exclusive API
     */
    getUser(username: string): Promise<GitHubEnterpriseUser>;
    /**
     * Create new user
     * GitHub Enterprise Server exclusive API
     */
    createUser(login: string, email: string, options?: {
        name?: string;
        password?: string;
    }): Promise<GitHubEnterpriseUser>;
    /**
     * Suspend user
     * GitHub Enterprise Server exclusive API
     */
    suspendUser(username: string, reason?: string): Promise<void>;
    /**
     * Unsuspend user
     * GitHub Enterprise Server exclusive API
     */
    unsuspendUser(username: string): Promise<void>;
    /**
     * Get enterprise statistics
     * GitHub Enterprise Server exclusive API
     */
    getStats(): Promise<GitHubEnterpriseStats>;
    /**
     * List security policies
     * GitHub Enterprise Server exclusive API
     */
    listSecurityPolicies(): Promise<GitHubSecurityPolicy[]>;
    /**
     * Enable/disable security policy
     * GitHub Enterprise Server exclusive API
     */
    updateSecurityPolicy(id: number, enabled: boolean): Promise<GitHubSecurityPolicy>;
    /**
     * Get maintenance mode status
     * GitHub Enterprise Server exclusive API
     */
    getMaintenanceStatus(): Promise<GitHubMaintenance>;
    /**
     * Enable maintenance mode
     * GitHub Enterprise Server exclusive API
     */
    enableMaintenance(scheduledTime?: string): Promise<GitHubMaintenance>;
    /**
     * Disable maintenance mode
     * GitHub Enterprise Server exclusive API
     */
    disableMaintenance(): Promise<GitHubMaintenance>;
    /**
     * Get backup status
     * GitHub Enterprise Server exclusive API
     */
    getBackupStatus(): Promise<GitHubBackupStatus>;
    /**
     * Enable backup
     * GitHub Enterprise Server exclusive API
     */
    enableBackup(): Promise<GitHubBackupStatus>;
    /**
     * Disable backup
     * GitHub Enterprise Server exclusive API
     */
    disableBackup(): Promise<GitHubBackupStatus>;
}
