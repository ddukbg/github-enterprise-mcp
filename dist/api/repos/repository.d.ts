import { GitHubClient } from '../../utils/client.js';
import { GitHubRepository, GitHubBranch, GitHubContent, CreateRepoOptions, UpdateRepoOptions, GitHubUser } from './types.js';
/**
 * Class providing GitHub repository-related functionality
 */
export declare class RepositoryAPI {
    private client;
    constructor(client: GitHubClient);
    /**
     * List repositories for a user or organization
     */
    listRepositories(owner: string, type?: 'all' | 'owner' | 'member', sort?: 'created' | 'updated' | 'pushed' | 'full_name', page?: number, perPage?: number): Promise<GitHubRepository[]>;
    /**
     * List repositories for an organization
     */
    listOrganizationRepositories(org: string, type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member', sort?: 'created' | 'updated' | 'pushed' | 'full_name', page?: number, perPage?: number): Promise<GitHubRepository[]>;
    /**
     * Get repository details
     */
    getRepository(owner: string, repo: string): Promise<GitHubRepository>;
    /**
     * Create a new repository (user account)
     */
    createRepository(options: CreateRepoOptions): Promise<GitHubRepository>;
    /**
     * Create a new repository (organization)
     */
    createOrganizationRepository(org: string, options: CreateRepoOptions): Promise<GitHubRepository>;
    /**
     * Update repository
     */
    updateRepository(owner: string, repo: string, options: UpdateRepoOptions): Promise<GitHubRepository>;
    /**
     * Delete repository
     */
    deleteRepository(owner: string, repo: string): Promise<void>;
    /**
     * List repository branches
     */
    listBranches(owner: string, repo: string, protected_only?: boolean, page?: number, perPage?: number): Promise<GitHubBranch[]>;
    /**
     * Get a specific branch
     */
    getBranch(owner: string, repo: string, branch: string): Promise<GitHubBranch>;
    /**
     * Get repository content (file or directory)
     */
    getContent(owner: string, repo: string, path: string, ref?: string): Promise<GitHubContent | GitHubContent[]>;
    /**
     * Create or update file content
     */
    createOrUpdateFile(owner: string, repo: string, path: string, message: string, content: string, sha?: string, branch?: string): Promise<{
        content: GitHubContent | null;
        commit: {
            sha: string;
            html_url: string;
        };
    }>;
    /**
     * Delete a file
     */
    deleteFile(owner: string, repo: string, path: string, message: string, sha: string, branch?: string): Promise<{
        commit: {
            sha: string;
            html_url: string;
        };
    }>;
    /**
     * Get repository topics
     */
    getTopics(owner: string, repo: string): Promise<{
        names: string[];
    }>;
    /**
     * Set repository topics
     */
    replaceTopics(owner: string, repo: string, topics: string[]): Promise<{
        names: string[];
    }>;
    /**
     * Get repository language distribution
     */
    getLanguages(owner: string, repo: string): Promise<Record<string, number>>;
    /**
     * Get repository contributors
     */
    getContributors(owner: string, repo: string, anon?: boolean, page?: number, perPage?: number): Promise<Array<GitHubUser & {
        contributions: number;
    }>>;
}
