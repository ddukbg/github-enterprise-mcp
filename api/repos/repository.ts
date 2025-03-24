import { GitHubClient } from '../../utils/client.js';
import { 
  GitHubRepository, 
  GitHubBranch, 
  GitHubContent,
  CreateRepoOptions,
  UpdateRepoOptions,
  GitHubUser
} from './types.js';

/**
 * Class providing GitHub repository-related functionality
 */
export class RepositoryAPI {
  private client: GitHubClient;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  /**
   * List repositories for a user or organization
   */
  async listRepositories(owner: string, type: 'all' | 'owner' | 'member' = 'all', sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'full_name', page = 1, perPage = 30): Promise<GitHubRepository[]> {
    return this.client.get<GitHubRepository[]>(`users/${owner}/repos`, {
      params: {
        type,
        sort,
        page,
        per_page: perPage
      }
    });
  }

  /**
   * List repositories for an organization
   */
  async listOrganizationRepositories(org: string, type: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member' = 'all', sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'full_name', page = 1, perPage = 30): Promise<GitHubRepository[]> {
    return this.client.get<GitHubRepository[]>(`orgs/${org}/repos`, {
      params: {
        type,
        sort,
        page,
        per_page: perPage
      }
    });
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.client.get<GitHubRepository>(`repos/${owner}/${repo}`);
  }

  /**
   * Create a new repository (user account)
   */
  async createRepository(options: CreateRepoOptions): Promise<GitHubRepository> {
    return this.client.post<GitHubRepository>('user/repos', options);
  }

  /**
   * Create a new repository (organization)
   */
  async createOrganizationRepository(org: string, options: CreateRepoOptions): Promise<GitHubRepository> {
    return this.client.post<GitHubRepository>(`orgs/${org}/repos`, options);
  }

  /**
   * Update repository
   */
  async updateRepository(owner: string, repo: string, options: UpdateRepoOptions): Promise<GitHubRepository> {
    return this.client.patch<GitHubRepository>(`repos/${owner}/${repo}`, options);
  }

  /**
   * Delete repository
   */
  async deleteRepository(owner: string, repo: string): Promise<void> {
    await this.client.delete(`repos/${owner}/${repo}`);
  }

  /**
   * List repository branches
   */
  async listBranches(owner: string, repo: string, protected_only = false, page = 1, perPage = 30): Promise<GitHubBranch[]> {
    return this.client.get<GitHubBranch[]>(`repos/${owner}/${repo}/branches`, {
      params: {
        protected: protected_only,
        page,
        per_page: perPage
      }
    });
  }

  /**
   * Get a specific branch
   */
  async getBranch(owner: string, repo: string, branch: string): Promise<GitHubBranch> {
    return this.client.get<GitHubBranch>(`repos/${owner}/${repo}/branches/${branch}`);
  }

  /**
   * Get repository content (file or directory)
   */
  async getContent(owner: string, repo: string, path: string, ref?: string): Promise<GitHubContent | GitHubContent[]> {
    return this.client.get<GitHubContent | GitHubContent[]>(`repos/${owner}/${repo}/contents/${path}`, {
      params: { ref }
    });
  }

  /**
   * Create or update file content
   */
  async createOrUpdateFile(owner: string, repo: string, path: string, message: string, content: string, sha?: string, branch?: string): Promise<{
    content: GitHubContent | null;
    commit: { sha: string; html_url: string; };
  }> {
    return this.client.put(`repos/${owner}/${repo}/contents/${path}`, {
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(owner: string, repo: string, path: string, message: string, sha: string, branch?: string): Promise<{
    commit: { sha: string; html_url: string; };
  }> {
    return this.client.delete(`repos/${owner}/${repo}/contents/${path}`, {
      body: {
        message,
        sha,
        branch
      }
    });
  }

  /**
   * Get repository topics
   */
  async getTopics(owner: string, repo: string): Promise<{ names: string[] }> {
    return this.client.get<{ names: string[] }>(`repos/${owner}/${repo}/topics`, {
      headers: {
        'Accept': 'application/vnd.github.mercy-preview+json'
      }
    });
  }

  /**
   * Set repository topics
   */
  async replaceTopics(owner: string, repo: string, topics: string[]): Promise<{ names: string[] }> {
    return this.client.put<{ names: string[] }>(`repos/${owner}/${repo}/topics`, {
      names: topics
    }, {
      headers: {
        'Accept': 'application/vnd.github.mercy-preview+json'
      }
    });
  }

  /**
   * Get repository language distribution
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.client.get<Record<string, number>>(`repos/${owner}/${repo}/languages`);
  }

  /**
   * Get repository contributors
   */
  async getContributors(owner: string, repo: string, anon = false, page = 1, perPage = 30): Promise<Array<GitHubUser & { contributions: number }>> {
    return this.client.get<Array<GitHubUser & { contributions: number }>>(`repos/${owner}/${repo}/contributors`, {
      params: {
        anon,
        page,
        per_page: perPage
      }
    });
  }
} 