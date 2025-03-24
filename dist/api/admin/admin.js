/**
 * Class providing GitHub Enterprise Server administrator features
 * This API is only available on GitHub Enterprise Server
 */
export class AdminAPI {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Retrieve license information
     * GitHub Enterprise Server exclusive API
     */
    async getLicenseInfo() {
        return this.client.get('enterprise/settings/license');
    }
    /**
     * List enterprise users
     * GitHub Enterprise Server exclusive API
     */
    async listUsers(page = 1, perPage = 30) {
        return this.client.get('admin/users', {
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
    async getUser(username) {
        return this.client.get(`admin/users/${username}`);
    }
    /**
     * Create new user
     * GitHub Enterprise Server exclusive API
     */
    async createUser(login, email, options = {}) {
        return this.client.post('admin/users', {
            login,
            email,
            ...options
        });
    }
    /**
     * Suspend user
     * GitHub Enterprise Server exclusive API
     */
    async suspendUser(username, reason) {
        await this.client.put(`admin/users/${username}/suspended`, {
            reason
        });
    }
    /**
     * Unsuspend user
     * GitHub Enterprise Server exclusive API
     */
    async unsuspendUser(username) {
        await this.client.delete(`admin/users/${username}/suspended`);
    }
    /**
     * Get enterprise statistics
     * GitHub Enterprise Server exclusive API
     */
    async getStats() {
        return this.client.get('enterprise/stats/all');
    }
    /**
     * List security policies
     * GitHub Enterprise Server exclusive API
     */
    async listSecurityPolicies() {
        return this.client.get('enterprise/settings/security');
    }
    /**
     * Enable/disable security policy
     * GitHub Enterprise Server exclusive API
     */
    async updateSecurityPolicy(id, enabled) {
        return this.client.patch(`enterprise/settings/security/${id}`, {
            enabled
        });
    }
    /**
     * Get maintenance mode status
     * GitHub Enterprise Server exclusive API
     */
    async getMaintenanceStatus() {
        return this.client.get('enterprise/maintenance');
    }
    /**
     * Enable maintenance mode
     * GitHub Enterprise Server exclusive API
     */
    async enableMaintenance(scheduledTime) {
        return this.client.put('enterprise/maintenance', {
            enabled: true,
            scheduled_at: scheduledTime
        });
    }
    /**
     * Disable maintenance mode
     * GitHub Enterprise Server exclusive API
     */
    async disableMaintenance() {
        return this.client.put('enterprise/maintenance', {
            enabled: false
        });
    }
    /**
     * Get backup status
     * GitHub Enterprise Server exclusive API
     */
    async getBackupStatus() {
        return this.client.get('enterprise/backup');
    }
    /**
     * Enable backup
     * GitHub Enterprise Server exclusive API
     */
    async enableBackup() {
        return this.client.put('enterprise/backup', {
            backup_enabled: true
        });
    }
    /**
     * Disable backup
     * GitHub Enterprise Server exclusive API
     */
    async disableBackup() {
        return this.client.put('enterprise/backup', {
            backup_enabled: false
        });
    }
}
