/**
 * GitHub Issues API Type Definitions
 */

// Parameters for listing issues
export interface ListIssuesParams {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  sort?: 'created' | 'updated' | 'comments';
  direction?: 'asc' | 'desc';
  since?: string;
  page?: number;
  per_page?: number;
}

// Parameters for getting a single issue
export interface GetIssueParams {
  owner: string;
  repo: string;
  issue_number: number;
}

// Parameters for creating an issue
export interface CreateIssueParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  assignees?: string[];
  labels?: string[];
  milestone?: number;
}

// Parameters for updating an issue
export interface UpdateIssueParams {
  owner: string;
  repo: string;
  issue_number: number;
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  assignees?: string[];
  labels?: string[];
  milestone?: number;
}

// Parameters for listing issue comments
export interface ListIssueCommentsParams {
  owner: string;
  repo: string;
  issue_number: number;
  page?: number;
  per_page?: number;
}

// Parameters for creating an issue comment
export interface CreateIssueCommentParams {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

// Issue type definition
export interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  locked: boolean;
  body?: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignees?: Array<{
    login: string;
    id: number;
    avatar_url: string;
  }>;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  html_url: string;
}

// Issue comment type definition
export interface IssueComment {
  id: number;
  body: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
} 