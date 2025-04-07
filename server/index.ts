import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Config, loadConfig } from '../utils/config.js';
import { getI18n } from '../i18n/index.js';
import { GitHubClient } from '../utils/client.js';
import { RepositoryAPI } from '../api/repos/repository.js';
import { AdminAPI } from '../api/admin/admin.js';
import { ActionsAPI } from '../api/actions/actions.js';
import * as PullsAPI from '../api/pulls/pulls.js';
import * as IssuesAPI from '../api/issues/issues.js';
import { startHttpServer } from './http.js';
import { UserManagement } from '../api/users/users.js';

// Common GitHub client instance
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

// MCP server options interface for GitHub Enterprise
export interface GitHubServerOptions {
  config?: Partial<Config>;
  transport?: 'stdio' | 'http';
}

/**
 * Convert repository information to user-friendly format
 */
function formatRepository(repo: any) {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description || getI18n().t('repos', 'no_description'),
    html_url: repo.html_url,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    language: repo.language,
    default_branch: repo.default_branch,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    watchers_count: repo.watchers_count,
    open_issues_count: repo.open_issues_count,
    license: repo.license ? repo.license.name : null,
    owner: {
      login: repo.owner.login,
      id: repo.owner.id,
      avatar_url: repo.owner.avatar_url,
      html_url: repo.owner.html_url,
      type: repo.owner.type
    }
  };
}

/**
 * Convert branch information to user-friendly format
 */
function formatBranch(branch: any) {
  return {
    name: branch.name,
    commit: {
      sha: branch.commit.sha
    },
    protected: branch.protected
  };
}

/**
 * Convert file content to user-friendly format
 */
function formatContent(content: any) {
  // For directory (array)
  if (Array.isArray(content)) {
    return content.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      url: item.html_url
    }));
  }
  
  // For file (single object)
  const result: any = {
    name: content.name,
    path: content.path,
    type: content.type,
    size: content.size,
    url: content.html_url
  };
  
  // Decode file content if available
  if (content.content && content.encoding === 'base64') {
    try {
      result.content = Buffer.from(content.content, 'base64').toString('utf-8');
    } catch (e) {
      result.content = 'Unable to decode file content.';
    }
  }
  
  return result;
}

/**
 * Format workflow information into user-friendly format
 */
function formatWorkflow(workflow: any) {
  return {
    id: workflow.id,
    name: workflow.name,
    path: workflow.path,
    state: workflow.state,
    created_at: workflow.created_at,
    updated_at: workflow.updated_at,
    url: workflow.html_url,
    badge_url: workflow.badge_url
  };
}

/**
 * Format workflow run information into user-friendly format
 */
function formatWorkflowRun(run: any) {
  return {
    id: run.id,
    name: run.name,
    workflow_id: run.workflow_id,
    run_number: run.run_number,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    created_at: run.created_at,
    updated_at: run.updated_at,
    url: run.html_url,
    head_branch: run.head_branch,
    head_sha: run.head_sha,
    run_attempt: run.run_attempt
  };
}

/**
 * GitHub Enterprise MCP server creation and start
 */
export async function startServer(options: GitHubServerOptions = {}): Promise<void> {
  // Load configuration
  const config = loadConfig(options.config);
  
  // Create GitHub client instance
  const client = new GitHubClient(config);
  
  // Create API instances
  const repository = new RepositoryAPI(client);
  const admin = new AdminAPI(client);
  const actions = new ActionsAPI(client);
  const pulls = PullsAPI;
  const issues = IssuesAPI;

  // Create context
  const context: GitHubContext = {
    client,
    repository,
    admin,
    actions,
    pulls,
    issues,
    users: new UserManagement(),
    isGitHubEnterprise: !!config.baseUrl && !config.baseUrl.includes('github.com')
  };

  // Create MCP server
  // Get i18n instance
  const i18n = getI18n();

  const server = new McpServer({
    name: "GitHub Enterprise",
    version: "1.0.0",
    description: i18n.t('common', 'server_description')
  });

  // Repository list tool
  server.tool(
    "list-repositories",
    {
      owner: z.string().describe(i18n.t('repos', 'param_owner')),
      isOrg: z.boolean().default(false).describe(i18n.t('repos', 'param_is_org')),
      type: z.enum(['all', 'owner', 'member', 'public', 'private', 'forks', 'sources']).default('all').describe(i18n.t('repos', 'param_repo_type')),
      sort: z.enum(['created', 'updated', 'pushed', 'full_name']).default('full_name').describe(i18n.t('repos', 'param_sort')),
      page: z.number().default(1).describe(i18n.t('common', 'param_page')),
      perPage: z.number().default(30).describe(i18n.t('common', 'param_per_page'))
    },
    async ({ owner, isOrg, type, sort, page, perPage }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        let repositories;

        if (isOrg) {
          repositories = await context.repository.listOrganizationRepositories(
            owner,
            type as any,
            sort as any,
            page as number,
            perPage as number
          );
        } else {
          repositories = await context.repository.listRepositories(
            owner,
            type as any,
            sort as any,
            page as number,
            perPage as number
          );
        }

        // No repositories found
        if (!repositories || repositories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'no_results', {
                  item: i18n.t('repos', 'repo_not_found', { owner: owner, repo: '' })
                })
              }
            ]
          };
        }

        // Format repository information
        const formattedRepos = repositories.map(formatRepository);

        return {
          content: [
            {
              type: "text",
              text: i18n.t('repos', 'repo_list_title', {
                type: isOrg ? i18n.t('repos', 'org_type') : i18n.t('repos', 'user_type'),
                name: owner,
                count: repositories.length
              }) + `\n\n${JSON.stringify(formattedRepos, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // Repository details tool
  server.tool(
    "get-repository",
    {
      owner: z.string().describe(i18n.t('repos', 'param_owner')),
      repo: z.string().describe(i18n.t('repos', 'param_repo'))
    },
    async ({ owner, repo }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_repo') })
              }
            ],
            isError: true
          };
        }

        const repository = await context.repository.getRepository(owner, repo);
        
        // Formatted repository information
        const formattedRepo = formatRepository(repository);
        
        return {
          content: [
            {
              type: "text",
              text: i18n.t('repos', 'repo_detail_title', { owner, repo }) + `\n\n${JSON.stringify(formattedRepo, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // Branch list tool
  server.tool(
    "list-branches",
    {
      owner: z.string().describe(i18n.t('repos', 'param_owner')),
      repo: z.string().describe(i18n.t('repos', 'param_repo')),
      protected_only: z.boolean().default(false).describe(i18n.t('repos', 'param_protected_only')),
      page: z.number().default(1).describe(i18n.t('common', 'param_page')),
      perPage: z.number().default(30).describe(i18n.t('common', 'param_per_page'))
    },
    async ({ owner, repo, protected_only, page, perPage }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_repo') })
              }
            ],
            isError: true
          };
        }

        const branches = await context.repository.listBranches(
          owner, 
          repo, 
          protected_only as boolean, 
          page as number, 
          perPage as number
        );
        
        // No branches found
        if (!branches || branches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('repos', 'branch_not_found', { owner, repo })
              }
            ]
          };
        }
        
        // Format branch information
        const formattedBranches = branches.map(formatBranch);
        
        return {
          content: [
            {
              type: "text",
              text: i18n.t('repos', 'branch_list_title', {
                owner,
                repo,
                count: branches.length,
                filter: protected_only ? i18n.t('repos', 'protected_branches_only') : ''
              }) + `\n\n${JSON.stringify(formattedBranches, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // File content tool
  server.tool(
    "get-content",
    {
      owner: z.string().describe(i18n.t('repos', 'param_owner')),
      repo: z.string().describe(i18n.t('repos', 'param_repo')),
      path: z.string().describe(i18n.t('repos', 'param_path')),
      ref: z.string().optional().describe(i18n.t('repos', 'param_ref'))
    },
    async ({ owner, repo, path, ref }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_repo') })
              }
            ],
            isError: true
          };
        }

        if (!path || typeof path !== 'string') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('repos', 'param_path') })
              }
            ],
            isError: true
          };
        }

        const content = await context.repository.getContent(owner, repo, path, ref);
        
        // Format content
        const formattedContent = formatContent(content);
        
        // Different response message based on whether it's a directory or file
        const isDirectory = Array.isArray(content);
        const responseText = isDirectory
          ? i18n.t('repos', 'file_content_title', {
              type: i18n.t('repos', 'directory_type'),
              path,
              count: (formattedContent as any[]).length
            })
          : i18n.t('repos', 'file_content_title', {
              type: i18n.t('repos', 'file_type'),
              path,
              count: 1
            });
        
        return {
          content: [
            {
              type: "text",
              text: `${responseText}\n\n${JSON.stringify(formattedContent, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // PR list tool
  server.tool(
    "list-pull-requests",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      state: z.enum(['open', 'closed', 'all']).default('open').describe("PR state filter"),
      sort: z.enum(['created', 'updated', 'popularity', 'long-running']).default('created').describe("Sort criteria"),
      direction: z.enum(['asc', 'desc']).default('desc').describe("Sort direction"),
      page: z.number().default(1).describe("Page number"),
      per_page: z.number().default(30).describe("Items per page")
    },
    async ({ owner, repo, state, sort, direction, page, per_page }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository owner (owner) is required."
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository name (repo) is required."
              }
            ],
            isError: true
          };
        }

        const pullRequests = await context.pulls.listPullRequests(context.client, {
          owner,
          repo,
          state,
          sort,
          direction,
          page,
          per_page
        });

        // No PRs found
        if (!pullRequests || pullRequests.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No pull requests found in repository '${owner}/${repo}' with state '${state}'.`
              }
            ]
          };
        }

        // Format PR info for better readability
        const formattedPRs = pullRequests.map(pr => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          user: pr.user.login,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          head: `${pr.head.repo.full_name}:${pr.head.ref}`,
          base: `${pr.base.repo.full_name}:${pr.base.ref}`,
          url: `${pr.number}`
        }));

        return {
          content: [
            {
              type: "text",
              text: `Pull requests in repository '${owner}/${repo}' (${pullRequests.length}):\n\n${JSON.stringify(formattedPRs, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error fetching pull requests:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while fetching pull requests: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // PR details tool
  server.tool(
    "get-pull-request",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      pull_number: z.number().describe("Pull request number")
    },
    async ({ owner, repo, pull_number }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository owner (owner) is required."
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository name (repo) is required."
              }
            ],
            isError: true
          };
        }

        if (!pull_number || typeof pull_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Pull request number (pull_number) is required."
              }
            ],
            isError: true
          };
        }

        const pullRequest = await context.pulls.getPullRequest(context.client, {
          owner,
          repo,
          pull_number
        });

        // Format PR info for better readability
        const formattedPR = {
          number: pullRequest.number,
          title: pullRequest.title,
          body: pullRequest.body,
          state: pullRequest.state,
          user: pullRequest.user.login,
          created_at: pullRequest.created_at,
          updated_at: pullRequest.updated_at,
          closed_at: pullRequest.closed_at,
          merged_at: pullRequest.merged_at,
          head: {
            ref: pullRequest.head.ref,
            sha: pullRequest.head.sha,
            repo: pullRequest.head.repo.full_name
          },
          base: {
            ref: pullRequest.base.ref,
            sha: pullRequest.base.sha,
            repo: pullRequest.base.repo.full_name
          },
          merged: pullRequest.merged,
          mergeable: pullRequest.mergeable,
          comments: pullRequest.comments,
          commits: pullRequest.commits,
          additions: pullRequest.additions,
          deletions: pullRequest.deletions,
          changed_files: pullRequest.changed_files,
          url: `${pullRequest.number}`
        };

        return {
          content: [
            {
              type: "text",
              text: `Pull request #${pull_number} details:\n\n${JSON.stringify(formattedPR, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error fetching pull request details:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while fetching pull request details: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // PR creation tool
  server.tool(
    "create-pull-request",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      title: z.string().describe("Pull request title"),
      head: z.string().describe("Head branch (e.g., 'username:feature' or just 'feature' for same repo)"),
      base: z.string().describe("Base branch (e.g., 'main')"),
      body: z.string().optional().describe("Pull request description"),
      draft: z.boolean().default(false).describe("Create as draft PR")
    },
    async ({ owner, repo, title, head, base, body, draft }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository owner (owner) is required."
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository name (repo) is required."
              }
            ],
            isError: true
          };
        }

        if (!title || typeof title !== 'string' || title.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Pull request title (title) is required."
              }
            ],
            isError: true
          };
        }

        if (!head || typeof head !== 'string' || head.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Head branch (head) is required."
              }
            ],
            isError: true
          };
        }

        if (!base || typeof base !== 'string' || base.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Base branch (base) is required."
              }
            ],
            isError: true
          };
        }

        const pullRequest = await context.pulls.createPullRequest(context.client, {
          owner,
          repo,
          title,
          head,
          base,
          body,
          draft
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully created pull request #${pullRequest.number}: "${pullRequest.title}"`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error creating pull request:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while creating pull request: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // PR merge tool
  server.tool(
    "merge-pull-request",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      pull_number: z.number().describe("Pull request number"),
      commit_title: z.string().optional().describe("Title for the automatic commit message"),
      commit_message: z.string().optional().describe("Extra detail to append to automatic commit message"),
      merge_method: z.enum(['merge', 'squash', 'rebase']).default('merge').describe("Merge method to use")
    },
    async ({ owner, repo, pull_number, commit_title, commit_message, merge_method }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository owner (owner) is required."
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Repository name (repo) is required."
              }
            ],
            isError: true
          };
        }

        if (!pull_number || typeof pull_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Pull request number (pull_number) is required."
              }
            ],
            isError: true
          };
        }

        const result = await context.pulls.mergePullRequest(context.client, {
          owner,
          repo,
          pull_number,
          commit_title,
          commit_message,
          merge_method
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully merged pull request #${pull_number}.\nResult: ${result.message}\nCommit SHA: ${result.sha}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error merging pull request:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while merging pull request: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // License info tool (GitHub Enterprise Server exclusive API)
  server.tool(
    "get-license-info",
    {},
    async () => {
      try {
        const licenseInfo = await context.admin.getLicenseInfo();
        
        return {
          content: [
            {
              type: "text",
              text: i18n.t('admin', 'license_info_title') + `\n\n${JSON.stringify(licenseInfo, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('admin', 'license_info_error', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // Enterprise stats tool (GitHub Enterprise Server exclusive API)
  server.tool(
    "get-enterprise-stats",
    {},
    async () => {
      try {
        const stats = await context.admin.getStats();
        return {
          content: [
            {
              type: "text",
              text: `GitHub Enterprise Statistics:\n\n${JSON.stringify(stats, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving GitHub Enterprise statistics: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Repository creation tool
  server.tool(
    "create-repository",
    {
      name: z.string().min(1).describe("Repository name"),
      description: z.string().optional().describe("Repository description"),
      private: z.boolean().optional().describe("Whether the repository is private"),
      auto_init: z.boolean().optional().describe("Initialize with README"),
      gitignore_template: z.string().optional().describe("Add .gitignore template"),
      license_template: z.string().optional().describe("Add a license template"),
      org: z.string().optional().describe("Organization name (if creating in an organization)")
    },
    async ({ name, description, private: isPrivate, auto_init, gitignore_template, license_template, org }) => {
      try {
        // Parameter validation
        if (!name || typeof name !== 'string' || name.trim() === '') {
        return {
          content: [
            {
              type: "text",
                text: "Repository name is required."
              }
            ]
          };
        }

        const options = {
          name,
          description,
          private: isPrivate,
          auto_init,
          gitignore_template,
          license_template
        };

        let repository;
        if (org) {
          repository = await context.repository.createOrganizationRepository(org, options);
        } else {
          repository = await context.repository.createRepository(options);
        }

        // Format repository information
        const formattedRepo = formatRepository(repository);

        return {
          content: [
            {
              type: "text",
              text: `Successfully created repository: ${formattedRepo.full_name}\n\n${JSON.stringify(formattedRepo, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating repository: ${error.message}`
            }
          ]
        };
      }
    }
  );
  
  // Repository update tool
  server.tool(
    "update-repository",
    {
      owner: z.string().min(1).describe("Repository owner"),
      repo: z.string().min(1).describe("Repository name"),
      description: z.string().optional().describe("New description"),
      private: z.boolean().optional().describe("Change privacy setting"),
      default_branch: z.string().optional().describe("Change default branch"),
      has_issues: z.boolean().optional().describe("Enable/disable issues"),
      has_projects: z.boolean().optional().describe("Enable/disable projects"),
      has_wiki: z.boolean().optional().describe("Enable/disable wiki"),
      archived: z.boolean().optional().describe("Archive/unarchive repository")
    },
    async ({ owner, repo, ...options }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository owner is required."
              }
            ]
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository name is required."
              }
            ]
          };
        }

        const repository = await context.repository.updateRepository(owner, repo, options);
        const formattedRepo = formatRepository(repository);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated repository: ${formattedRepo.full_name}\n\n${JSON.stringify(formattedRepo, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating repository: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Repository deletion tool
  server.tool(
    "delete-repository",
    {
      owner: z.string().min(1).describe("Repository owner"),
      repo: z.string().min(1).describe("Repository name"),
      confirm: z.boolean().describe("Confirmation for deletion (must be true)")
    },
    async ({ owner, repo, confirm }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository owner is required."
              }
            ]
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository name is required."
              }
            ]
          };
        }

        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text: "You must set 'confirm' to true to delete a repository. This action is irreversible."
              }
            ]
          };
        }

        await context.repository.deleteRepository(owner, repo);

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted repository: ${owner}/${repo}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting repository: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // List workflows tool
  server.tool(
    "list-workflows",
    {
      owner: z.string().min(1).describe("Repository owner"),
      repo: z.string().min(1).describe("Repository name"),
      page: z.number().int().positive().optional().describe("Page number"),
      perPage: z.number().int().positive().optional().describe("Items per page")
    },
    async ({ owner, repo, page, perPage }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository owner is required."
              }
            ]
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository name is required."
              }
            ]
          };
        }

        const response = await context.actions.listWorkflows(owner, repo, page, perPage);
        
        if (!response.workflows || response.workflows.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No workflows found in repository '${owner}/${repo}'.`
              }
            ]
          };
        }

        const formattedWorkflows = response.workflows.map(formatWorkflow);

        return {
          content: [
            {
              type: "text",
              text: `Workflows in repository '${owner}/${repo}' (${response.total_count}):\n\n${JSON.stringify(formattedWorkflows, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing workflows: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // List workflow runs tool
  server.tool(
    "list-workflow-runs",
    {
      owner: z.string().min(1).describe("Repository owner"),
      repo: z.string().min(1).describe("Repository name"),
      workflow_id: z.union([z.string(), z.number()]).optional().describe("Workflow ID or file name"),
      branch: z.string().optional().describe("Filter by branch name"),
      status: z.enum(['completed', 'action_required', 'cancelled', 'failure', 'neutral', 'skipped', 'stale', 'success', 'timed_out', 'in_progress', 'queued', 'requested', 'waiting']).optional().describe("Filter by run status"),
      page: z.number().int().positive().optional().describe("Page number"),
      perPage: z.number().int().positive().optional().describe("Items per page")
    },
    async ({ owner, repo, workflow_id, branch, status, page, perPage }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository owner is required."
              }
            ]
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository name is required."
              }
            ]
          };
        }

        const response = await context.actions.listWorkflowRuns(owner, repo, {
          workflow_id,
          branch,
          status,
          page,
          per_page: perPage
        });
        
        if (!response.workflow_runs || response.workflow_runs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: workflow_id
                  ? `No workflow runs found for workflow '${workflow_id}' in repository '${owner}/${repo}'.`
                  : `No workflow runs found in repository '${owner}/${repo}'.`
              }
            ]
          };
        }

        const formattedRuns = response.workflow_runs.map(formatWorkflowRun);

        return {
          content: [
            {
              type: "text",
              text: `${workflow_id ? `Workflow '${workflow_id}'` : 'Workflow'} runs in repository '${owner}/${repo}' (${response.total_count}):\n\n${JSON.stringify(formattedRuns, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing workflow runs: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // Trigger workflow tool
  server.tool(
    "trigger-workflow",
    {
      owner: z.string().min(1).describe("Repository owner"),
      repo: z.string().min(1).describe("Repository name"),
      workflow_id: z.union([z.string(), z.number()]).describe("Workflow ID or file name"),
      ref: z.string().min(1).describe("Git reference (branch, tag, SHA)"),
      inputs: z.record(z.string()).optional().describe("Workflow inputs")
    },
    async ({ owner, repo, workflow_id, ref, inputs }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository owner is required."
              }
            ]
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Repository name is required."
              }
            ]
          };
        }

        if (!workflow_id) {
          return {
            content: [
              {
                type: "text",
                text: "Workflow ID or filename is required."
              }
            ]
          };
        }

        if (!ref || typeof ref !== 'string' || ref.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Git reference (branch, tag, or SHA) is required."
              }
            ]
          };
        }

        await context.actions.dispatchWorkflow(owner, repo, workflow_id, { ref, inputs });

        return {
          content: [
            {
              type: "text",
              text: `Successfully triggered workflow '${workflow_id}' in repository '${owner}/${repo}' on ref '${ref}'.`
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error triggering workflow: ${error.message}`
            }
          ]
        };
      }
    }
  );

  // List issues tool
  server.tool(
    "list-issues",
    {
      owner: z.string().describe(i18n.t('issues', 'param_owner')),
      repo: z.string().describe(i18n.t('issues', 'param_repo')),
      state: z.enum(['open', 'closed', 'all']).default('open').describe(i18n.t('issues', 'param_state')),
      sort: z.enum(['created', 'updated', 'comments']).default('created').describe(i18n.t('issues', 'param_sort')),
      direction: z.enum(['asc', 'desc']).default('desc').describe(i18n.t('issues', 'param_direction')),
      page: z.number().default(1).describe(i18n.t('common', 'param_page')),
      per_page: z.number().default(30).describe(i18n.t('common', 'param_per_page'))
    },
    async ({ owner, repo, state, sort, direction, page, per_page }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_repo') })
              }
            ],
            isError: true
          };
        }

        const issues = await context.issues.listIssues(context.client, {
          owner,
          repo,
          state,
          sort,
          direction,
          page,
          per_page
        });

        // No issues found
        if (!issues || issues.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('issues', 'issue_not_found', { owner, repo, state })
              }
            ]
          };
        }

        // Format issues info for better readability
        const formattedIssues = issues.map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          user: issue.user.login,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          body: issue.body ? (issue.body.length > 100 ? issue.body.substring(0, 100) + '...' : issue.body) : '',
          comments: issue.comments,
          labels: issue.labels.map((label: any) => label.name),
          assignees: issue.assignees?.map((assignee: any) => assignee.login) || []
        }));

        return {
          content: [
            {
              type: "text",
              text: i18n.t('issues', 'issue_list_title', { owner, repo, count: issues.length }) + `\n\n${JSON.stringify(formattedIssues, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );
  
  // Get issue details tool
  server.tool(
    "get-issue",
    {
      owner: z.string().describe(i18n.t('issues', 'param_owner')),
      repo: z.string().describe(i18n.t('issues', 'param_repo')),
      issue_number: z.number().describe(i18n.t('issues', 'param_issue_number'))
    },
    async ({ owner, repo, issue_number }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_repo') })
              }
            ],
            isError: true
          };
        }

        if (!issue_number || typeof issue_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_issue_number') })
              }
            ],
            isError: true
          };
        }

        const issue = await context.issues.getIssue(context.client, {
          owner,
          repo,
          issue_number
        });

        // Format issue info for better readability
        const formattedIssue = {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          user: issue.user.login,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          closed_at: issue.closed_at,
          comments: issue.comments,
          labels: issue.labels.map((label: any) => label.name),
          assignees: issue.assignees?.map((assignee: any) => assignee.login) || []
        };

        return {
          content: [
            {
              type: "text",
              text: i18n.t('issues', 'issue_detail_title', { number: issue_number }) + `\n\n${JSON.stringify(formattedIssue, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // Create issue tool
  server.tool(
    "create-issue",
    {
      owner: z.string().describe(i18n.t('issues', 'param_owner')),
      repo: z.string().describe(i18n.t('issues', 'param_repo')),
      title: z.string().describe(i18n.t('issues', 'param_title')),
      body: z.string().optional().describe(i18n.t('issues', 'param_body')),
      labels: z.array(z.string()).optional().describe(i18n.t('issues', 'param_labels')),
      assignees: z.array(z.string()).optional().describe(i18n.t('issues', 'param_assignees')),
      milestone: z.number().optional().describe(i18n.t('issues', 'param_milestone'))
    },
    async ({ owner, repo, title, body, labels, assignees, milestone }) => {
      try {
        // Parameter validation
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_owner') })
              }
            ],
            isError: true
          };
        }

        if (!repo || typeof repo !== 'string' || repo.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_repo') })
              }
            ],
            isError: true
          };
        }

        if (!title || typeof title !== 'string' || title.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: i18n.t('common', 'error_required', { field: i18n.t('issues', 'param_title') })
              }
            ],
            isError: true
          };
        }

        const issue = await context.issues.createIssue(context.client, {
          owner,
          repo,
          title,
          body,
          labels,
          assignees,
          milestone
        });

        // Format created issue info
        const formattedIssue = {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          user: issue.user.login,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          labels: issue.labels.map((label: any) => label.name),
          assignees: issue.assignees?.map((assignee: any) => assignee.login) || []
        };

        return {
          content: [
            {
              type: "text",
              text: i18n.t('issues', 'issue_create_success', { number: issue.number, title: issue.title }) + `\n\n${JSON.stringify(formattedIssue, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error(i18n.t('common', 'error_generic', { message: error.message }));
        return {
          content: [
            {
              type: "text",
              text: i18n.t('common', 'error_generic', { message: error.message })
            }
          ],
          isError: true
        };
      }
    }
  );

  // User management tools
  server.tool(
    "list-users",
    {
      per_page: z.number().optional().describe("Number of results per page (max 100)"),
      page: z.number().optional().describe("Page number for pagination"),
      filter: z.enum(['all', 'active', 'suspended']).optional().describe("Filter users by status"),
      search: z.string().optional().describe("Search query to filter users by username or email")
    },
    async ({ per_page, page, filter, search }) => {
      try {
        const users = await context.users.listUsers(context.client, {
          per_page,
          page,
          filter,
          search
        });
        
        return {
          content: [
            {
              type: "text",
              text: `GitHub Enterprise users list:\n\n${JSON.stringify(users, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error listing users:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while retrieving users list: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "get-user",
    {
      username: z.string().describe("Username of the user to retrieve")
    },
    async ({ username }) => {
      try {
        const user = await context.users.getUser(context.client, { username });
        
        return {
          content: [
            {
              type: "text",
              text: `User details for '${username}':\n\n${JSON.stringify(user, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error getting user details:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while retrieving user details: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "create-user",
    {
      login: z.string().describe("The username for the user"),
      email: z.string().describe("The email address for the user"),
      name: z.string().optional().describe("Full name for the user"),
      company: z.string().optional().describe("Company for the user"),
      location: z.string().optional().describe("Location for the user"),
      bio: z.string().optional().describe("Biography for the user"),
      blog: z.string().optional().describe("URL of the user's blog or website"),
      twitter_username: z.string().optional().describe("Twitter username for the user")
    },
    async ({ login, email, name, company, location, bio, blog, twitter_username }) => {
      try {
        if (!context.isGitHubEnterprise) {
          return {
            content: [
              {
                type: "text",
                text: "User creation is only available in GitHub Enterprise. This operation cannot be performed on GitHub.com."
              }
            ],
            isError: true
          };
        }

        const user = await context.users.createUser(context.client, {
          login,
          email,
          name,
          company,
          location,
          bio,
          blog,
          twitter_username
        });
        
        return {
          content: [
            {
              type: "text",
              text: `User '${login}' successfully created:\n\n${JSON.stringify(user, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error creating user:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while creating user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "update-user",
    {
      username: z.string().describe("Username of the user to update"),
      email: z.string().optional().describe("The email address for the user"),
      name: z.string().optional().describe("Full name for the user"),
      company: z.string().optional().describe("Company for the user"),
      location: z.string().optional().describe("Location for the user"),
      bio: z.string().optional().describe("Biography for the user"),
      blog: z.string().optional().describe("URL of the user's blog or website"),
      twitter_username: z.string().optional().describe("Twitter username for the user")
    },
    async ({ username, email, name, company, location, bio, blog, twitter_username }) => {
      try {
        if (!context.isGitHubEnterprise) {
          return {
            content: [
              {
                type: "text",
                text: "User updates are only available in GitHub Enterprise. This operation cannot be performed on GitHub.com."
              }
            ],
            isError: true
          };
        }

        const user = await context.users.updateUser(context.client, {
          username,
          email,
          name,
          company,
          location,
          bio,
          blog,
          twitter_username
        });
        
        return {
          content: [
            {
              type: "text",
              text: `User '${username}' successfully updated:\n\n${JSON.stringify(user, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error updating user:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while updating user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "delete-user",
    {
      username: z.string().describe("Username of the user to delete")
    },
    async ({ username }) => {
      try {
        if (!context.isGitHubEnterprise) {
          return {
            content: [
              {
                type: "text",
                text: "User deletion is only available in GitHub Enterprise. This operation cannot be performed on GitHub.com."
              }
            ],
            isError: true
          };
        }

        await context.users.deleteUser(context.client, { username });
        
        return {
          content: [
            {
              type: "text",
              text: `User '${username}' has been successfully deleted.`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error deleting user:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while deleting user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "suspend-user",
    {
      username: z.string().describe("Username of the user to suspend"),
      reason: z.string().optional().describe("Reason for the suspension")
    },
    async ({ username, reason }) => {
      try {
        if (!context.isGitHubEnterprise) {
          return {
            content: [
              {
                type: "text",
                text: "User suspension is only available in GitHub Enterprise. This operation cannot be performed on GitHub.com."
              }
            ],
            isError: true
          };
        }

        await context.users.suspendUser(context.client, { username, reason });
        
        return {
          content: [
            {
              type: "text",
              text: `User '${username}' has been suspended.${reason ? ` Reason: ${reason}` : ''}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error suspending user:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while suspending user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "unsuspend-user",
    {
      username: z.string().describe("Username of the user to unsuspend")
    },
    async ({ username }) => {
      try {
        if (!context.isGitHubEnterprise) {
          return {
            content: [
              {
                type: "text",
                text: "User unsuspension is only available in GitHub Enterprise. This operation cannot be performed on GitHub.com."
              }
            ],
            isError: true
          };
        }

        await context.users.unsuspendUser(context.client, { username });
        
        return {
          content: [
            {
              type: "text",
              text: `User '${username}' has been unsuspended.`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error unsuspending user:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while unsuspending user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "list-user-orgs",
    {
      username: z.string().describe("Username of the user whose organizations to list"),
      per_page: z.number().optional().describe("Number of results per page (max 100)"),
      page: z.number().optional().describe("Page number for pagination")
    },
    async ({ username, per_page, page }) => {
      try {
        const orgs = await context.users.listUserOrganizations(context.client, {
          username,
          per_page,
          page
        });
        
        return {
          content: [
            {
              type: "text",
              text: `Organizations for user '${username}':\n\n${JSON.stringify(orgs, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error listing user organizations:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while listing user organizations: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Server start
  if (options.transport === 'http') {
    // Using HTTP transport
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await startHttpServer(server, port);
    console.log(i18n.t('common', 'server_start_http', { port }));
    console.log(i18n.t('common', 'api_url', { url: config.baseUrl }));
  } else {
    // Using default stdio transport
    const transport = new StdioServerTransport();
    
    // Keep stdin input processing for communication with Cursor
    process.stdin.resume();
    
    // Handle connection errors
    try {
      await server.connect(transport);
      console.log(i18n.t('common', 'server_start', { transport: options.transport || 'stdio' }));
      console.log(i18n.t('common', 'api_url', { url: config.baseUrl }));
      
      // Handle connection termination
      process.on('SIGINT', () => {
        console.log(i18n.t('common', 'server_shutdown'));
        process.exit(0);
      });
    } catch (error: any) {
      console.error(i18n.t('common', 'server_connection_error', { message: error.message }));
      process.exit(1);
    }
  }
}

// CLI execution case, automatically start server
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  startServer();
} 
