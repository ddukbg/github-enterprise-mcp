import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Config, loadConfig } from '../utils/config.js';
import { GitHubClient } from '../utils/client.js';
import { RepositoryAPI } from '../api/repos/repository.js';
import { AdminAPI } from '../api/admin/admin.js';
import { startHttpServer } from './http.js';

// 공통 GitHub 클라이언트 인스턴스
export interface GitHubContext {
  client: GitHubClient;
  repository: RepositoryAPI;
  admin: AdminAPI;
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

  // 컨텍스트 생성
  const context: GitHubContext = {
    client,
    repository,
    admin
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
  
  // 서버 시작
  if (options.transport === 'http') {
    // HTTP 트랜스포트 사용
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await startHttpServer(server, port);
    console.log(`GitHub Enterprise MCP HTTP 서버가 시작되었습니다. (포트: ${port})`);
    console.log(`사용 중인 GitHub API URL: ${config.baseUrl}`);
  } else {
    // 기본 stdio 트랜스포트 사용
    const transport = new StdioServerTransport();
    
    // Cursor와의 통신을 위해 stdin 입력 처리를 유지
    process.stdin.resume();
    
    // 연결 오류 처리
    try {
      await server.connect(transport);
      console.log(`GitHub Enterprise MCP 서버가 시작되었습니다. (${options.transport || 'stdio'})`);
      console.log(`사용 중인 GitHub API URL: ${config.baseUrl}`);
      
      // 연결 종료 시 처리
      process.on('SIGINT', () => {
        console.log('서버 종료 중...');
        process.exit(0);
      });
    } catch (error: any) {
      console.error(`MCP 서버 연결 실패: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI 실행일 경우 자동으로 서버 시작
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  startServer();
} 