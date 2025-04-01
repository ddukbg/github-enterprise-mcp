import { Config } from '../utils/config.js';
import { GitHubClient } from '../utils/client.js';
import { RepositoryAPI } from '../api/repos/repository.js';
import { AdminAPI } from '../api/admin/admin.js';
import { ActionsAPI } from '../api/actions/actions.js';
import * as PullsAPI from '../api/pulls/pulls.js';
import * as IssuesAPI from '../api/issues/issues.js';
import { UserManagement } from '../api/users/users.js';
export interface GitHubContext {
    client: GitHubClient;
    repository: RepositoryAPI;
    admin: AdminAPI;
    actions: ActionsAPI;
    pulls: typeof PullsAPI;
    issues: typeof IssuesAPI;
    users: UserManagement;
    isGitHubEnterprise: boolean;
}
export interface GitHubServerOptions {
    config?: Partial<Config>;
    transport?: 'stdio' | 'http';
}
/**
 * GitHub Enterprise MCP server creation and start
 */
export declare function startServer(options?: GitHubServerOptions): Promise<void>;
