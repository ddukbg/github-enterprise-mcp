/**
 * Types for Pull Request API
 */

// Pull Request state
export type PullRequestState = 'open' | 'closed' | 'all';

// Base Pull Request interface
export interface PullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  head: {
    ref: string;
    sha: string;
    repo: {
      id: number;
      name: string;
      full_name: string;
    }
  };
  base: {
    ref: string;
    sha: string;
    repo: {
      id: number;
      name: string;
      full_name: string;
    }
  };
  user: {
    id: number;
    login: string;
    avatar_url?: string;
  };
  merged: boolean;
  mergeable?: boolean;
  mergeable_state?: string;
  comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

// Parameters for listing pull requests
export interface ListPullRequestsParams {
  owner: string;
  repo: string;
  state?: PullRequestState;
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Parameters for getting a single pull request
export interface GetPullRequestParams {
  owner: string;
  repo: string;
  pull_number: number;
}

// Parameters for creating a pull request
export interface CreatePullRequestParams {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
  maintainer_can_modify?: boolean;
}

// Parameters for updating a pull request
export interface UpdatePullRequestParams {
  owner: string;
  repo: string;
  pull_number: number;
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  base?: string;
  maintainer_can_modify?: boolean;
}

// Parameters for merging a pull request
export interface MergePullRequestParams {
  owner: string;
  repo: string;
  pull_number: number;
  commit_title?: string;
  commit_message?: string;
  merge_method?: 'merge' | 'squash' | 'rebase';
}

// Response for merge operation
export interface MergePullRequestResponse {
  sha: string;
  merged: boolean;
  message: string;
} 