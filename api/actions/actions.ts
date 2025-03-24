import { GitHubClient } from '../../utils/client.js';
import {
  GitHubWorkflow,
  GitHubWorkflowListResponse,
  GitHubWorkflowRun,
  GitHubWorkflowRunListResponse,
  GitHubWorkflowRunJob,
  GitHubWorkflowRunJobsResponse,
  WorkflowDispatchOptions,
  RerunWorkflowOptions
} from './types.js';

/**
 * Class providing GitHub Actions functionality
 */
export class ActionsAPI {
  private client: GitHubClient;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  /**
   * List workflows in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param page Page number
   * @param perPage Items per page
   */
  async listWorkflows(owner: string, repo: string, page = 1, perPage = 30): Promise<GitHubWorkflowListResponse> {
    return this.client.get<GitHubWorkflowListResponse>(`repos/${owner}/${repo}/actions/workflows`, {
      params: {
        page,
        per_page: perPage
      }
    });
  }

  /**
   * Get a specific workflow
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID or file name
   */
  async getWorkflow(owner: string, repo: string, workflowId: number | string): Promise<GitHubWorkflow> {
    return this.client.get<GitHubWorkflow>(`repos/${owner}/${repo}/actions/workflows/${workflowId}`);
  }

  /**
   * List workflow runs for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param options Additional options for filtering runs
   */
  async listWorkflowRuns(owner: string, repo: string, options: {
    workflow_id?: number | string;
    actor?: string;
    branch?: string;
    event?: string;
    status?: 'completed' | 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'in_progress' | 'queued' | 'requested' | 'waiting';
    created?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<GitHubWorkflowRunListResponse> {
    const endpoint = options.workflow_id
      ? `repos/${owner}/${repo}/actions/workflows/${options.workflow_id}/runs`
      : `repos/${owner}/${repo}/actions/runs`;

    const { workflow_id, ...params } = options;

    return this.client.get<GitHubWorkflowRunListResponse>(endpoint, {
      params
    });
  }

  /**
   * Get a specific workflow run
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Run ID
   */
  async getWorkflowRun(owner: string, repo: string, runId: number): Promise<GitHubWorkflowRun> {
    return this.client.get<GitHubWorkflowRun>(`repos/${owner}/${repo}/actions/runs/${runId}`);
  }

  /**
   * List jobs for a workflow run
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Run ID
   * @param filter Filter by job status
   */
  async listWorkflowRunJobs(owner: string, repo: string, runId: number, filter?: 'latest' | 'all', page = 1, perPage = 30): Promise<GitHubWorkflowRunJobsResponse> {
    return this.client.get<GitHubWorkflowRunJobsResponse>(`repos/${owner}/${repo}/actions/runs/${runId}/jobs`, {
      params: {
        filter,
        page,
        per_page: perPage
      }
    });
  }

  /**
   * Download workflow run logs
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Run ID
   * @returns Redirect URL to download logs
   */
  async getWorkflowRunLogs(owner: string, repo: string, runId: number): Promise<{url: string}> {
    const response = await this.client.get<{url: string}>(`repos/${owner}/${repo}/actions/runs/${runId}/logs`, {
      responseType: 'redirect'
    });
    return response;
  }

  /**
   * Trigger a workflow run (workflow_dispatch event)
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID or file name
   * @param options Options for workflow dispatch
   */
  async dispatchWorkflow(owner: string, repo: string, workflowId: number | string, options: WorkflowDispatchOptions): Promise<void> {
    await this.client.post(`repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, options);
  }

  /**
   * Re-run a workflow
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Run ID
   * @param options Options for workflow re-run
   */
  async rerunWorkflow(owner: string, repo: string, runId: number, options?: RerunWorkflowOptions): Promise<void> {
    await this.client.post(`repos/${owner}/${repo}/actions/runs/${runId}/rerun`, options || {});
  }

  /**
   * Cancel a workflow run
   * @param owner Repository owner
   * @param repo Repository name
   * @param runId Run ID
   */
  async cancelWorkflowRun(owner: string, repo: string, runId: number): Promise<void> {
    await this.client.post(`repos/${owner}/${repo}/actions/runs/${runId}/cancel`, {});
  }

  /**
   * Enable a workflow
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID or file name
   */
  async enableWorkflow(owner: string, repo: string, workflowId: number | string): Promise<void> {
    await this.client.put(`repos/${owner}/${repo}/actions/workflows/${workflowId}/enable`, {});
  }

  /**
   * Disable a workflow
   * @param owner Repository owner
   * @param repo Repository name
   * @param workflowId Workflow ID or file name
   */
  async disableWorkflow(owner: string, repo: string, workflowId: number | string): Promise<void> {
    await this.client.put(`repos/${owner}/${repo}/actions/workflows/${workflowId}/disable`, {});
  }
} 