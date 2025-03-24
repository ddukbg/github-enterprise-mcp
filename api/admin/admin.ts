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
 * GitHub Enterprise Server 관리자 기능을 제공하는 클래스
 * 이 API는 GitHub Enterprise Server에서만 사용 가능합니다.
 */
export class AdminAPI {
  private client: GitHubClient;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  /**
   * 라이센스 정보 조회
   * GitHub Enterprise Server 전용 API
   */
  async getLicenseInfo(): Promise<GitHubLicenseInfo> {
    return this.client.get<GitHubLicenseInfo>('enterprise/settings/license');
  }

  /**
   * 엔터프라이즈 사용자 목록 조회
   * GitHub Enterprise Server 전용 API
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
   * 특정 사용자 조회
   * GitHub Enterprise Server 전용 API
   */
  async getUser(username: string): Promise<GitHubEnterpriseUser> {
    return this.client.get<GitHubEnterpriseUser>(`admin/users/${username}`);
  }

  /**
   * 새 사용자 생성
   * GitHub Enterprise Server 전용 API
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
   * 사용자 일시 정지
   * GitHub Enterprise Server 전용 API
   */
  async suspendUser(username: string, reason?: string): Promise<void> {
    await this.client.put(`admin/users/${username}/suspended`, {
      reason
    });
  }

  /**
   * 사용자 일시 정지 해제
   * GitHub Enterprise Server 전용 API
   */
  async unsuspendUser(username: string): Promise<void> {
    await this.client.delete(`admin/users/${username}/suspended`);
  }

  /**
   * 엔터프라이즈 통계 조회
   * GitHub Enterprise Server 전용 API
   */
  async getStats(): Promise<GitHubEnterpriseStats> {
    return this.client.get<GitHubEnterpriseStats>('enterprise/stats/all');
  }

  /**
   * 보안 정책 목록 조회
   * GitHub Enterprise Server 전용 API
   */
  async listSecurityPolicies(): Promise<GitHubSecurityPolicy[]> {
    return this.client.get<GitHubSecurityPolicy[]>('enterprise/settings/security');
  }

  /**
   * 보안 정책 활성화/비활성화
   * GitHub Enterprise Server 전용 API
   */
  async updateSecurityPolicy(id: number, enabled: boolean): Promise<GitHubSecurityPolicy> {
    return this.client.patch<GitHubSecurityPolicy>(`enterprise/settings/security/${id}`, {
      enabled
    });
  }

  /**
   * 유지보수 모드 상태 조회
   * GitHub Enterprise Server 전용 API
   */
  async getMaintenanceStatus(): Promise<GitHubMaintenance> {
    return this.client.get<GitHubMaintenance>('enterprise/maintenance');
  }

  /**
   * 유지보수 모드 활성화
   * GitHub Enterprise Server 전용 API
   */
  async enableMaintenance(scheduledTime?: string): Promise<GitHubMaintenance> {
    return this.client.put<GitHubMaintenance>('enterprise/maintenance', {
      enabled: true,
      scheduled_at: scheduledTime
    });
  }

  /**
   * 유지보수 모드 비활성화
   * GitHub Enterprise Server 전용 API
   */
  async disableMaintenance(): Promise<GitHubMaintenance> {
    return this.client.put<GitHubMaintenance>('enterprise/maintenance', {
      enabled: false
    });
  }

  /**
   * 백업 상태 조회
   * GitHub Enterprise Server 전용 API
   */
  async getBackupStatus(): Promise<GitHubBackupStatus> {
    return this.client.get<GitHubBackupStatus>('enterprise/backup');
  }

  /**
   * 백업 활성화
   * GitHub Enterprise Server 전용 API
   */
  async enableBackup(): Promise<GitHubBackupStatus> {
    return this.client.put<GitHubBackupStatus>('enterprise/backup', {
      backup_enabled: true
    });
  }

  /**
   * 백업 비활성화
   * GitHub Enterprise Server 전용 API
   */
  async disableBackup(): Promise<GitHubBackupStatus> {
    return this.client.put<GitHubBackupStatus>('enterprise/backup', {
      backup_enabled: false
    });
  }
} 