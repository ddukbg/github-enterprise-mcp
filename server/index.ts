import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Config, loadConfig } from '../utils/config.js';
import { GitHubClient } from '../utils/client.js';
import { RepositoryAPI } from '../api/repos/repository.js';
import { AdminAPI } from '../api/admin/admin.js';
import * as PullsAPI from '../api/pulls/pulls.js';
import * as IssuesAPI from '../api/issues/issues.js';
import { startHttpServer } from './http.js';

// 공통 GitHub 클라이언트 인스턴스
export interface GitHubContext {
  client: GitHubClient;
  repository: RepositoryAPI;
  admin: AdminAPI;
  pulls: typeof PullsAPI;
  issues: typeof IssuesAPI;
}

// GitHub Enterprise를 위한 MCP 서버 옵션 인터페이스
export interface GitHubServerOptions {
  config?: Partial<Config>;
  transport?: 'stdio' | 'http';
}

/**
 * 저장소 정보를 사용자 친화적 형식으로 변환
 */
function formatRepository(repo: any) {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description || '설명 없음',
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
 * 브랜치 정보를 사용자 친화적 형식으로 변환
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
 * 파일 내용을 사용자 친화적 형식으로 변환
 */
function formatContent(content: any) {
  // 디렉토리인 경우 (배열)
  if (Array.isArray(content)) {
    return content.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      url: item.html_url
    }));
  }
  
  // 파일인 경우 (단일 객체)
  const result: any = {
    name: content.name,
    path: content.path,
    type: content.type,
    size: content.size,
    url: content.html_url
  };
  
  // 파일 내용이 있으면 디코딩
  if (content.content && content.encoding === 'base64') {
    try {
      result.content = Buffer.from(content.content, 'base64').toString('utf-8');
    } catch (e) {
      result.content = '파일 내용을 디코딩할 수 없습니다.';
    }
  }
  
  return result;
}

/**
 * GitHub Enterprise MCP 서버 생성 및 시작
 */
export async function startServer(options: GitHubServerOptions = {}): Promise<void> {
  // 설정 로드
  const config = loadConfig(options.config);
  
  // GitHub 클라이언트 인스턴스 생성
  const client = new GitHubClient(config);
  
  // API 인스턴스 생성
  const repository = new RepositoryAPI(client);
  const admin = new AdminAPI(client);
  const pulls = PullsAPI;
  const issues = IssuesAPI;

  // 컨텍스트 생성
  const context: GitHubContext = {
    client,
    repository,
    admin,
    pulls,
    issues
  };

  // MCP 서버 생성
  const server = new McpServer({
    name: "GitHub Enterprise",
    version: "1.0.0",
    description: "GitHub Enterprise Server API를 통해 저장소, PR, 이슈, 코드 등의 정보를 조회하고 관리합니다."
  });

  // 저장소 목록 조회 도구
  server.tool(
    "list-repositories",
    {
      owner: z.string().describe("사용자 또는 조직 이름"),
      isOrg: z.boolean().default(false).describe("조직인지 여부 (true: 조직, false: 사용자)"),
      type: z.enum(['all', 'owner', 'member', 'public', 'private', 'forks', 'sources']).default('all').describe("저장소 유형 필터"),
      sort: z.enum(['created', 'updated', 'pushed', 'full_name']).default('full_name').describe("정렬 기준"),
      page: z.number().default(1).describe("페이지 번호"),
      perPage: z.number().default(30).describe("페이지당 항목 수")
    },
    async ({ owner, isOrg, type, sort, page, perPage }) => {
      try {
        // owner 매개변수 검증
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "오류: 사용자 또는 조직 이름(owner)은 필수 항목입니다."
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

        // 저장소가 없는 경우
        if (!repositories || repositories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `${isOrg ? '조직' : '사용자'} '${owner}'의 저장소를 찾을 수 없습니다.`
              }
            ]
          };
        }

        // 저장소 정보 형식화
        const formattedRepos = repositories.map(formatRepository);

        return {
          content: [
            {
              type: "text",
              text: `${isOrg ? '조직' : '사용자'} '${owner}'의 저장소 목록 (${repositories.length}개):\n\n${JSON.stringify(formattedRepos, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('저장소 목록 조회 오류:', error);
        return {
          content: [
            {
              type: "text",
              text: `저장소 목록 조회 중 오류가 발생했습니다: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 저장소 세부 정보 조회 도구
  server.tool(
    "get-repository",
    {
      owner: z.string().describe("저장소 소유자 (사용자 또는 조직)"),
      repo: z.string().describe("저장소 이름")
    },
    async ({ owner, repo }) => {
      try {
        // 매개변수 검증
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "오류: 저장소 소유자(owner)는 필수 항목입니다."
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
                text: "오류: 저장소 이름(repo)은 필수 항목입니다."
              }
            ],
            isError: true
          };
        }

        const repository = await context.repository.getRepository(owner, repo);
        
        // 형식화된 저장소 정보
        const formattedRepo = formatRepository(repository);
        
        return {
          content: [
            {
              type: "text",
              text: `저장소 '${owner}/${repo}' 정보:\n\n${JSON.stringify(formattedRepo, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('저장소 정보 조회 오류:', error);
        return {
          content: [
            {
              type: "text",
              text: `저장소 정보 조회 중 오류가 발생했습니다: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 브랜치 목록 조회 도구
  server.tool(
    "list-branches",
    {
      owner: z.string().describe("저장소 소유자 (사용자 또는 조직)"),
      repo: z.string().describe("저장소 이름"),
      protected_only: z.boolean().default(false).describe("보호된 브랜치만 표시할지 여부"),
      page: z.number().default(1).describe("페이지 번호"),
      perPage: z.number().default(30).describe("페이지당 항목 수")
    },
    async ({ owner, repo, protected_only, page, perPage }) => {
      try {
        // 매개변수 검증
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "오류: 저장소 소유자(owner)는 필수 항목입니다."
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
                text: "오류: 저장소 이름(repo)은 필수 항목입니다."
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
        
        // 브랜치가 없는 경우
        if (!branches || branches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `저장소 '${owner}/${repo}'에 브랜치가 없습니다.`
              }
            ]
          };
        }
        
        // 브랜치 정보 형식화
        const formattedBranches = branches.map(formatBranch);
        
        return {
          content: [
            {
              type: "text",
              text: `저장소 '${owner}/${repo}'의 브랜치 목록 (${branches.length}개)${protected_only ? ' (보호된 브랜치만)' : ''}:\n\n${JSON.stringify(formattedBranches, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('브랜치 목록 조회 오류:', error);
        return {
          content: [
            {
              type: "text",
              text: `브랜치 목록 조회 중 오류가 발생했습니다: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 파일 내용 조회 도구
  server.tool(
    "get-content",
    {
      owner: z.string().describe("저장소 소유자 (사용자 또는 조직)"),
      repo: z.string().describe("저장소 이름"),
      path: z.string().describe("파일 또는 디렉토리 경로"),
      ref: z.string().optional().describe("브랜치 또는 커밋 해시 (기본값: 기본 브랜치)")
    },
    async ({ owner, repo, path, ref }) => {
      try {
        // 매개변수 검증
        if (!owner || typeof owner !== 'string' || owner.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "오류: 저장소 소유자(owner)는 필수 항목입니다."
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
                text: "오류: 저장소 이름(repo)은 필수 항목입니다."
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
                text: "오류: 파일 또는 디렉토리 경로(path)는 필수 항목입니다."
              }
            ],
            isError: true
          };
        }

        const content = await context.repository.getContent(owner, repo, path, ref);
        
        // 내용 형식화
        const formattedContent = formatContent(content);
        
        // 디렉토리인지 파일인지에 따라 다른 응답 메시지
        const isDirectory = Array.isArray(content);
        const responseText = isDirectory
          ? `디렉토리 '${path}'의 내용 (${(formattedContent as any[]).length}개 항목):`
          : `파일 '${path}'의 내용:`;
        
        return {
          content: [
            {
              type: "text",
              text: `저장소 '${owner}/${repo}'의 ${responseText}\n\n${JSON.stringify(formattedContent, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('파일/디렉토리 내용 조회 오류:', error);
        return {
          content: [
            {
              type: "text",
              text: `파일/디렉토리 내용 조회 중 오류가 발생했습니다: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // PR 목록 조회 도구
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

  // PR 상세 조회 도구
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

  // PR 생성 도구
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

  // PR 병합 도구
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

  // 라이센스 정보 조회 도구 (GitHub Enterprise Server 전용 API)
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
              text: `GitHub Enterprise 라이센스 정보:\n\n${JSON.stringify(licenseInfo, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('라이센스 정보 조회 오류:', error);
        return {
          content: [
            {
              type: "text",
              text: `라이센스 정보 조회 중 오류가 발생했습니다: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // 엔터프라이즈 통계 조회 도구 (GitHub Enterprise Server 전용 API)
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
              text: `GitHub Enterprise 통계 정보:\n\n${JSON.stringify(stats, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('엔터프라이즈 통계 조회 오류:', error);
        return {
          content: [
            {
              type: "text",
              text: `엔터프라이즈 통계 조회 중 오류가 발생했습니다: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Issue list tool
  server.tool(
    "list-issues",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      state: z.enum(['open', 'closed', 'all']).default('open').describe("Issue state filter"),
      sort: z.enum(['created', 'updated', 'comments']).default('created').describe("Sort criteria"),
      direction: z.enum(['asc', 'desc']).default('desc').describe("Sort direction"),
      since: z.string().optional().describe("Only issues updated after this time (ISO 8601 format)"),
      page: z.number().default(1).describe("Page number"),
      per_page: z.number().default(30).describe("Items per page")
    },
    async ({ owner, repo, state, sort, direction, since, page, per_page }) => {
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

        const issues = await context.issues.listIssues(context.client, {
          owner,
          repo,
          state,
          sort,
          direction,
          since,
          page,
          per_page
        });

        // No issues found
        if (!issues || issues.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No issues found in repository '${owner}/${repo}' with state '${state}'.`
              }
            ]
          };
        }

        // Format issue info for better readability
        const formattedIssues = issues.map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          user: issue.user.login,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          comments: issue.comments,
          labels: issue.labels.map(label => label.name),
          url: issue.html_url
        }));

        return {
          content: [
            {
              type: "text",
              text: `Issues in repository '${owner}/${repo}' with state '${state}' (${issues.length}):\n\n${JSON.stringify(formattedIssues, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error fetching issues:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while fetching issues: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Issue details tool
  server.tool(
    "get-issue",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number")
    },
    async ({ owner, repo, issue_number }) => {
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

        if (!issue_number || typeof issue_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Issue number (issue_number) is required."
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
          locked: issue.locked,
          user: issue.user.login,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          closed_at: issue.closed_at,
          comments: issue.comments,
          labels: issue.labels.map(label => label.name),
          assignees: issue.assignees?.map(assignee => assignee.login),
          url: issue.html_url
        };

        return {
          content: [
            {
              type: "text",
              text: `Issue #${issue_number} details:\n\n${JSON.stringify(formattedIssue, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error fetching issue details:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while fetching issue details: ${error.message}`
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
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      title: z.string().describe("Issue title"),
      body: z.string().optional().describe("Issue body content"),
      assignees: z.array(z.string()).optional().describe("Array of user logins to assign"),
      labels: z.array(z.string()).optional().describe("Array of label names"),
      milestone: z.number().optional().describe("Milestone ID")
    },
    async ({ owner, repo, title, body, assignees, labels, milestone }) => {
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
                text: "Error: Issue title (title) is required."
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
          assignees,
          labels,
          milestone
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully created issue #${issue.number}: "${issue.title}"`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error creating issue:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while creating issue: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Update issue tool
  server.tool(
    "update-issue",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number"),
      title: z.string().optional().describe("New issue title"),
      body: z.string().optional().describe("New issue body content"),
      state: z.enum(['open', 'closed']).optional().describe("Issue state"),
      assignees: z.array(z.string()).optional().describe("Array of user logins to assign"),
      labels: z.array(z.string()).optional().describe("Array of label names"),
      milestone: z.number().optional().describe("Milestone ID")
    },
    async ({ owner, repo, issue_number, title, body, state, assignees, labels, milestone }) => {
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

        if (!issue_number || typeof issue_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Issue number (issue_number) is required."
              }
            ],
            isError: true
          };
        }

        // At least one update field must be provided
        if (title === undefined && body === undefined && state === undefined && 
            assignees === undefined && labels === undefined && milestone === undefined) {
          return {
            content: [
              {
                type: "text",
                text: "Error: At least one field to update must be provided."
              }
            ],
            isError: true
          };
        }

        const issue = await context.issues.updateIssue(context.client, {
          owner,
          repo,
          issue_number,
          title,
          body,
          state,
          assignees,
          labels,
          milestone
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated issue #${issue.number}: "${issue.title}" (state: ${issue.state})`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error updating issue:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while updating issue: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // List issue comments tool
  server.tool(
    "list-issue-comments",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number"),
      page: z.number().default(1).describe("Page number"),
      per_page: z.number().default(30).describe("Items per page")
    },
    async ({ owner, repo, issue_number, page, per_page }) => {
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

        if (!issue_number || typeof issue_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Issue number (issue_number) is required."
              }
            ],
            isError: true
          };
        }

        const comments = await context.issues.listIssueComments(context.client, {
          owner,
          repo,
          issue_number,
          page,
          per_page
        });

        // No comments found
        if (!comments || comments.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No comments found for issue #${issue_number} in repository '${owner}/${repo}'.`
              }
            ]
          };
        }

        // Format comments info for better readability
        const formattedComments = comments.map(comment => ({
          id: comment.id,
          user: comment.user.login,
          body: comment.body,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          url: comment.html_url
        }));

        return {
          content: [
            {
              type: "text",
              text: `Comments for issue #${issue_number} (${comments.length}):\n\n${JSON.stringify(formattedComments, null, 2)}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error fetching issue comments:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while fetching issue comments: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Create issue comment tool
  server.tool(
    "create-issue-comment",
    {
      owner: z.string().describe("Repository owner (user or organization)"),
      repo: z.string().describe("Repository name"),
      issue_number: z.number().describe("Issue number"),
      body: z.string().describe("Comment text")
    },
    async ({ owner, repo, issue_number, body }) => {
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

        if (!issue_number || typeof issue_number !== 'number') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Issue number (issue_number) is required."
              }
            ],
            isError: true
          };
        }

        if (!body || typeof body !== 'string' || body.trim() === '') {
          return {
            content: [
              {
                type: "text",
                text: "Error: Comment text (body) is required."
              }
            ],
            isError: true
          };
        }

        const comment = await context.issues.createIssueComment(context.client, {
          owner,
          repo,
          issue_number,
          body
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully added comment to issue #${issue_number}. Comment ID: ${comment.id}`
            }
          ]
        };
      } catch (error: any) {
        console.error('Error creating issue comment:', error);
        return {
          content: [
            {
              type: "text",
              text: `An error occurred while creating issue comment: ${error.message}`
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
    console.log(`GitHub Enterprise MCP HTTP server started. (Port: ${port})`);
    console.log(`Using GitHub API URL: ${config.baseUrl}`);
  } else {
    // Using default stdio transport
    const transport = new StdioServerTransport();
    
    // Keep stdin input processing for communication with Cursor
    process.stdin.resume();
    
    // Handle connection errors
    try {
      await server.connect(transport);
      console.log(`GitHub Enterprise MCP server started. (${options.transport || 'stdio'})`);
      console.log(`Using GitHub API URL: ${config.baseUrl}`);
      
      // Handle connection termination
      process.on('SIGINT', () => {
        console.log('Shutting down server...');
        process.exit(0);
      });
    } catch (error: any) {
      console.error(`MCP server connection failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI 실행일 경우 자동으로 서버 시작
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  startServer();
}