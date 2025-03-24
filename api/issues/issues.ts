/**
 * GitHub Issues API Implementation
 */
import { GitHubClient } from '../../utils/client.js';
import {
  Issue,
  IssueComment,
  ListIssuesParams,
  GetIssueParams,
  CreateIssueParams,
  UpdateIssueParams,
  ListIssueCommentsParams,
  CreateIssueCommentParams
} from './types.js';

/**
 * List issues for a repository
 */
export async function listIssues(
  client: GitHubClient,
  params: ListIssuesParams
): Promise<Issue[]> {
  const { owner, repo, ...rest } = params;
  const queryParams = new URLSearchParams();
  
  // Add additional parameters
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return client.get<Issue[]>(`/repos/${owner}/${repo}/issues${queryString}`);
}

/**
 * Get a single issue
 */
export async function getIssue(
  client: GitHubClient,
  params: GetIssueParams
): Promise<Issue> {
  const { owner, repo, issue_number } = params;
  return client.get<Issue>(`/repos/${owner}/${repo}/issues/${issue_number}`);
}

/**
 * Create a new issue
 */
export async function createIssue(
  client: GitHubClient,
  params: CreateIssueParams
): Promise<Issue> {
  const { owner, repo, ...data } = params;
  return client.post<Issue>(`/repos/${owner}/${repo}/issues`, data);
}

/**
 * Update an existing issue
 */
export async function updateIssue(
  client: GitHubClient,
  params: UpdateIssueParams
): Promise<Issue> {
  const { owner, repo, issue_number, ...data } = params;
  return client.patch<Issue>(`/repos/${owner}/${repo}/issues/${issue_number}`, data);
}

/**
 * Close an issue
 */
export async function closeIssue(
  client: GitHubClient,
  params: GetIssueParams
): Promise<Issue> {
  const { owner, repo, issue_number } = params;
  return client.patch<Issue>(`/repos/${owner}/${repo}/issues/${issue_number}`, { state: 'closed' });
}

/**
 * Reopen an issue
 */
export async function reopenIssue(
  client: GitHubClient,
  params: GetIssueParams
): Promise<Issue> {
  const { owner, repo, issue_number } = params;
  return client.patch<Issue>(`/repos/${owner}/${repo}/issues/${issue_number}`, { state: 'open' });
}

/**
 * List comments on an issue
 */
export async function listIssueComments(
  client: GitHubClient,
  params: ListIssueCommentsParams
): Promise<IssueComment[]> {
  const { owner, repo, issue_number, ...rest } = params;
  const queryParams = new URLSearchParams();
  
  // Add additional parameters
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return client.get<IssueComment[]>(`/repos/${owner}/${repo}/issues/${issue_number}/comments${queryString}`);
}

/**
 * Create a comment on an issue
 */
export async function createIssueComment(
  client: GitHubClient,
  params: CreateIssueCommentParams
): Promise<IssueComment> {
  const { owner, repo, issue_number, body } = params;
  return client.post<IssueComment>(`/repos/${owner}/${repo}/issues/${issue_number}/comments`, { body });
} 