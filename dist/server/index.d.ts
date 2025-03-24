import { Config } from '../utils/config.js';
import { GitHubClient } from '../utils/client.js';
import { RepositoryAPI } from '../api/repos/repository.js';
import { AdminAPI } from '../api/admin/admin.js';
export interface GitHubContext {
    client: GitHubClient;
    repository: RepositoryAPI;
    admin: AdminAPI;
}
export interface GitHubServerOptions {
    config?: Partial<Config>;
    transport?: 'stdio' | 'http';
}
/**
 * GitHub Enterprise MCP 서버 생성 및 시작
 */
export declare function startServer(options?: GitHubServerOptions): Promise<void>;
