/**
 * GitHub 저장소 타입 정의
 */

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: GitHubLicense | null;
  topics: string[];
  default_branch: string;
  visibility: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubContent {
  type: string;
  encoding?: string;
  size: number;
  name: string;
  path: string;
  content?: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string | null;
  _links: {
    git: string;
    self: string;
    html: string;
  };
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  visibility?: 'public' | 'private' | 'internal';
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  has_downloads?: boolean;
  has_discussions?: boolean;
  is_template?: boolean;
  team_id?: number;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  allow_auto_merge?: boolean;
  delete_branch_on_merge?: boolean;
}

export interface UpdateRepoOptions {
  name?: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  visibility?: 'public' | 'private' | 'internal';
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  has_downloads?: boolean;
  has_discussions?: boolean;
  default_branch?: string;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  allow_auto_merge?: boolean;
  delete_branch_on_merge?: boolean;
  archived?: boolean;
} 