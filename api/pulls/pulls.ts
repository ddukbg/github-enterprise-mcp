/**
 * GitHub Enterprise Pull Requests API implementation
 */

import { GitHubClient } from '../../utils/client.js';
import {
  PullRequest,
  ListPullRequestsParams,
  GetPullRequestParams,
  CreatePullRequestParams,
  UpdatePullRequestParams,
  MergePullRequestParams,
  MergePullRequestResponse
} from './types.js';

/**
 * List pull requests for a repository
 * @param client GitHub client instance
 * @param params Request parameters
 * @returns Array of pull requests
 */
export async function listPullRequests(
  client: GitHubClient,
  params: ListPullRequestsParams
): Promise<PullRequest[]> {
  const { owner, repo, state = 'open', sort = 'created', direction = 'desc', page, per_page } = params;
  
  const queryParams = new URLSearchParams();
  if (state) queryParams.append('state', state);
  if (sort) queryParams.append('sort', sort);
  if (direction) queryParams.append('direction', direction);
  if (page) queryParams.append('page', page.toString());
  if (per_page) queryParams.append('per_page', per_page.toString());
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return client.get<PullRequest[]>(`/repos/${owner}/${repo}/pulls${query}`);
}

/**
 * Get a specific pull request
 * @param client GitHub client instance
 * @param params Request parameters
 * @returns Pull request details
 */
export async function getPullRequest(
  client: GitHubClient,
  params: GetPullRequestParams
): Promise<PullRequest> {
  const { owner, repo, pull_number } = params;
  
  return client.get<PullRequest>(`/repos/${owner}/${repo}/pulls/${pull_number}`);
}

/**
 * Create a new pull request
 * @param client GitHub client instance
 * @param params Request parameters
 * @returns Created pull request
 */
export async function createPullRequest(
  client: GitHubClient,
  params: CreatePullRequestParams
): Promise<PullRequest> {
  const { owner, repo, ...data } = params;
  
  return client.post<PullRequest>(
    `/repos/${owner}/${repo}/pulls`,
    data
  );
}

/**
 * Update an existing pull request
 * @param client GitHub client instance
 * @param params Request parameters
 * @returns Updated pull request
 */
export async function updatePullRequest(
  client: GitHubClient,
  params: UpdatePullRequestParams
): Promise<PullRequest> {
  const { owner, repo, pull_number, ...data } = params;
  
  return client.patch<PullRequest>(
    `/repos/${owner}/${repo}/pulls/${pull_number}`,
    data
  );
}

/**
 * Merge a pull request
 * @param client GitHub client instance
 * @param params Request parameters
 * @returns Merge result
 */
export async function mergePullRequest(
  client: GitHubClient,
  params: MergePullRequestParams
): Promise<MergePullRequestResponse> {
  const { owner, repo, pull_number, ...data } = params;
  
  return client.put<MergePullRequestResponse>(
    `/repos/${owner}/${repo}/pulls/${pull_number}/merge`,
    data
  );
} 