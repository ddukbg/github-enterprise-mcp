/**
 * GitHub Enterprise Server 관리자 API 타입 정의
 */

// 라이센스 정보 인터페이스
export interface GitHubLicenseInfo {
  seats: number;
  seats_used: number;
  seats_available: number;
  kind: string;
  days_until_expiration: number;
  expire_at: string;
}

// 엔터프라이즈 사용자 인터페이스
export interface GitHubEnterpriseUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
  created_at: string;
  updated_at: string;
  suspended: boolean;
  organizations_count: number;
  repositories_count: number;
}

// 엔터프라이즈 통계 인터페이스
export interface GitHubEnterpriseStats {
  repos: {
    total_repos: number;
    root_repos: number;
    fork_repos: number;
    org_repos: number;
    total_pushes: number;
    total_wikis: number;
  };
  hooks: {
    total_hooks: number;
    active_hooks: number;
    inactive_hooks: number;
  };
  pages: {
    total_pages: number;
  };
  orgs: {
    total_orgs: number;
    disabled_orgs: number;
    total_teams: number;
    total_team_members: number;
  };
  users: {
    total_users: number;
    admin_users: number;
    suspended_users: number;
  };
  pulls: {
    total_pulls: number;
    merged_pulls: number;
    mergeable_pulls: number;
    unmergeable_pulls: number;
  };
  issues: {
    total_issues: number;
    open_issues: number;
    closed_issues: number;
  };
  milestones: {
    total_milestones: number;
    open_milestones: number;
    closed_milestones: number;
  };
  gists: {
    total_gists: number;
    private_gists: number;
    public_gists: number;
  };
  comments: {
    total_commit_comments: number;
    total_gist_comments: number;
    total_issue_comments: number;
    total_pull_request_comments: number;
  };
}

// 보안 정책 인터페이스
export interface GitHubSecurityPolicy {
  id: number;
  name: string;
  enabled: boolean;
  description: string;
  settings?: Record<string, any>;
}

// 시스템 유지보수 인터페이스
export interface GitHubMaintenance {
  enabled: boolean;
  scheduled_at: string | null;
  active_until: string | null;
}

// 백업 상태 인터페이스
export interface GitHubBackupStatus {
  backup_enabled: boolean;
  last_backup_at: string | null;
  next_backup_at: string | null;
} 