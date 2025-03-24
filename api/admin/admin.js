/**
 * GitHub Enterprise Server 관리자 기능을 제공하는 클래스
 * 이 API는 GitHub Enterprise Server에서만 사용 가능합니다.
 */
export class AdminAPI {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * 라이센스 정보 조회
     * GitHub Enterprise Server 전용 API
     */
    async getLicenseInfo() {
        return this.client.get('enterprise/settings/license');
    }
    /**
     * 엔터프라이즈 사용자 목록 조회
     * GitHub Enterprise Server 전용 API
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
     * 특정 사용자 조회
     * GitHub Enterprise Server 전용 API
     */
    async getUser(username) {
        return this.client.get(`admin/users/${username}`);
    }
    /**
     * 새 사용자 생성
     * GitHub Enterprise Server 전용 API
     */
    async createUser(login, email, options = {}) {
        return this.client.post('admin/users', {
            login,
            email,
            ...options
        });
    }
    /**
     * 사용자 일시 정지
     * GitHub Enterprise Server 전용 API
     */
    async suspendUser(username, reason) {
        await this.client.put(`admin/users/${username}/suspended`, {
            reason
        });
    }
    /**
     * 사용자 일시 정지 해제
     * GitHub Enterprise Server 전용 API
     */
    async unsuspendUser(username) {
        await this.client.delete(`admin/users/${username}/suspended`);
    }
    /**
     * 엔터프라이즈 통계 조회
     * GitHub Enterprise Server 전용 API
     */
    async getStats() {
        return this.client.get('enterprise/stats/all');
    }
    /**
     * 보안 정책 목록 조회
     * GitHub Enterprise Server 전용 API
     */
    async listSecurityPolicies() {
        return this.client.get('enterprise/settings/security');
    }
    /**
     * 보안 정책 활성화/비활성화
     * GitHub Enterprise Server 전용 API
     */
    async updateSecurityPolicy(id, enabled) {
        return this.client.patch(`enterprise/settings/security/${id}`, {
            enabled
        });
    }
    /**
     * 유지보수 모드 상태 조회
     * GitHub Enterprise Server 전용 API
     */
    async getMaintenanceStatus() {
        return this.client.get('enterprise/maintenance');
    }
    /**
     * 유지보수 모드 활성화
     * GitHub Enterprise Server 전용 API
     */
    async enableMaintenance(scheduledTime) {
        return this.client.put('enterprise/maintenance', {
            enabled: true,
            scheduled_at: scheduledTime
        });
    }
    /**
     * 유지보수 모드 비활성화
     * GitHub Enterprise Server 전용 API
     */
    async disableMaintenance() {
        return this.client.put('enterprise/maintenance', {
            enabled: false
        });
    }
    /**
     * 백업 상태 조회
     * GitHub Enterprise Server 전용 API
     */
    async getBackupStatus() {
        return this.client.get('enterprise/backup');
    }
    /**
     * 백업 활성화
     * GitHub Enterprise Server 전용 API
     */
    async enableBackup() {
        return this.client.put('enterprise/backup', {
            backup_enabled: true
        });
    }
    /**
     * 백업 비활성화
     * GitHub Enterprise Server 전용 API
     */
    async disableBackup() {
        return this.client.put('enterprise/backup', {
            backup_enabled: false
        });
    }
}
