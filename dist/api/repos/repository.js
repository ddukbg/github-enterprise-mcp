/**
 * Class providing GitHub repository-related functionality
 */
export class RepositoryAPI {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * List repositories for a user or organization
     */
    async listRepositories(owner, type = 'all', sort = 'full_name', page = 1, perPage = 30) {
        return this.client.get(`users/${owner}/repos`, {
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
    async listOrganizationRepositories(org, type = 'all', sort = 'full_name', page = 1, perPage = 30) {
        return this.client.get(`orgs/${org}/repos`, {
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
    async getRepository(owner, repo) {
        return this.client.get(`repos/${owner}/${repo}`);
    }
    /**
     * Create a new repository (user account)
     */
    async createRepository(options) {
        return this.client.post('user/repos', options);
    }
    /**
     * Create a new repository (organization)
     */
    async createOrganizationRepository(org, options) {
        return this.client.post(`orgs/${org}/repos`, options);
    }
    /**
     * Update repository
     */
    async updateRepository(owner, repo, options) {
        return this.client.patch(`repos/${owner}/${repo}`, options);
    }
    /**
     * Delete repository
     */
    async deleteRepository(owner, repo) {
        await this.client.delete(`repos/${owner}/${repo}`);
    }
    /**
     * List repository branches
     */
    async listBranches(owner, repo, protected_only = false, page = 1, perPage = 30) {
        return this.client.get(`repos/${owner}/${repo}/branches`, {
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
    async getBranch(owner, repo, branch) {
        return this.client.get(`repos/${owner}/${repo}/branches/${branch}`);
    }
    /**
     * Get repository content (file or directory)
     */
    async getContent(owner, repo, path, ref) {
        return this.client.get(`repos/${owner}/${repo}/contents/${path}`, {
            params: { ref }
        });
    }
    /**
     * Create or update file content
     */
    async createOrUpdateFile(owner, repo, path, message, content, sha, branch) {
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
    async deleteFile(owner, repo, path, message, sha, branch) {
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
    async getTopics(owner, repo) {
        return this.client.get(`repos/${owner}/${repo}/topics`, {
            headers: {
                'Accept': 'application/vnd.github.mercy-preview+json'
            }
        });
    }
    /**
     * Set repository topics
     */
    async replaceTopics(owner, repo, topics) {
        return this.client.put(`repos/${owner}/${repo}/topics`, {
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
    async getLanguages(owner, repo) {
        return this.client.get(`repos/${owner}/${repo}/languages`);
    }
    /**
     * Get repository contributors
     */
    async getContributors(owner, repo, anon = false, page = 1, perPage = 30) {
        return this.client.get(`repos/${owner}/${repo}/contributors`, {
            params: {
                anon,
                page,
                per_page: perPage
            }
        });
    }
}
