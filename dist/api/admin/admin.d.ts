import { GitHubClient } from '../../utils/client.js';
import { GitHubLicenseInfo, GitHubEnterpriseUser, GitHubEnterpriseStats, GitHubSecurityPolicy, GitHubMaintenance, GitHubBackupStatus } from './types.js';
/**
 * GitHub Enterprise Server 관리자 기능을 제공하는 클래스
 * 이 API는 GitHub Enterprise Server에서만 사용 가능합니다.
 */
export declare class AdminAPI {
    private client;
    constructor(client: GitHubClient);
    /**
     * 라이센스 정보 조회
     * GitHub Enterprise Server 전용 API
     */
    getLicenseInfo(): Promise<GitHubLicenseInfo>;
    /**
     * 엔터프라이즈 사용자 목록 조회
     * GitHub Enterprise Server 전용 API
     */
    listUsers(page?: number, perPage?: number): Promise<GitHubEnterpriseUser[]>;
    /**
     * 특정 사용자 조회
     * GitHub Enterprise Server 전용 API
     */
    getUser(username: string): Promise<GitHubEnterpriseUser>;
    /**
     * 새 사용자 생성
     * GitHub Enterprise Server 전용 API
     */
    createUser(login: string, email: string, options?: {
        name?: string;
        password?: string;
    }): Promise<GitHubEnterpriseUser>;
    /**
     * 사용자 일시 정지
     * GitHub Enterprise Server 전용 API
     */
    suspendUser(username: string, reason?: string): Promise<void>;
    /**
     * 사용자 일시 정지 해제
     * GitHub Enterprise Server 전용 API
     */
    unsuspendUser(username: string): Promise<void>;
    /**
     * 엔터프라이즈 통계 조회
     * GitHub Enterprise Server 전용 API
     */
    getStats(): Promise<GitHubEnterpriseStats>;
    /**
     * 보안 정책 목록 조회
     * GitHub Enterprise Server 전용 API
     */
    listSecurityPolicies(): Promise<GitHubSecurityPolicy[]>;
    /**
     * 보안 정책 활성화/비활성화
     * GitHub Enterprise Server 전용 API
     */
    updateSecurityPolicy(id: number, enabled: boolean): Promise<GitHubSecurityPolicy>;
    /**
     * 유지보수 모드 상태 조회
     * GitHub Enterprise Server 전용 API
     */
    getMaintenanceStatus(): Promise<GitHubMaintenance>;
    /**
     * 유지보수 모드 활성화
     * GitHub Enterprise Server 전용 API
     */
    enableMaintenance(scheduledTime?: string): Promise<GitHubMaintenance>;
    /**
     * 유지보수 모드 비활성화
     * GitHub Enterprise Server 전용 API
     */
    disableMaintenance(): Promise<GitHubMaintenance>;
    /**
     * 백업 상태 조회
     * GitHub Enterprise Server 전용 API
     */
    getBackupStatus(): Promise<GitHubBackupStatus>;
    /**
     * 백업 활성화
     * GitHub Enterprise Server 전용 API
     */
    enableBackup(): Promise<GitHubBackupStatus>;
    /**
     * 백업 비활성화
     * GitHub Enterprise Server 전용 API
     */
    disableBackup(): Promise<GitHubBackupStatus>;
}
