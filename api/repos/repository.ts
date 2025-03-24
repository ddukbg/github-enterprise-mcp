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
 * GitHub 저장소 관련 기능을 제공하는 클래스
 */
export class RepositoryAPI {
  private client: GitHubClient;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  /**
   * 사용자 또는 조직의 저장소 목록 조회
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
   * 조직의 저장소 목록 조회
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
   * 저장소 세부 정보 조회
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.client.get<GitHubRepository>(`repos/${owner}/${repo}`);
  }

  /**
   * 새 저장소 생성 (사용자 계정)
   */
  async createRepository(options: CreateRepoOptions): Promise<GitHubRepository> {
    return this.client.post<GitHubRepository>('user/repos', options);
  }

  /**
   * 새 저장소 생성 (조직)
   */
  async createOrganizationRepository(org: string, options: CreateRepoOptions): Promise<GitHubRepository> {
    return this.client.post<GitHubRepository>(`orgs/${org}/repos`, options);
  }

  /**
   * 저장소 업데이트
   */
  async updateRepository(owner: string, repo: string, options: UpdateRepoOptions): Promise<GitHubRepository> {
    return this.client.patch<GitHubRepository>(`repos/${owner}/${repo}`, options);
  }

  /**
   * 저장소 삭제
   */
  async deleteRepository(owner: string, repo: string): Promise<void> {
    await this.client.delete(`repos/${owner}/${repo}`);
  }

  /**
   * 저장소 브랜치 목록 조회
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
   * 특정 브랜치 조회
   */
  async getBranch(owner: string, repo: string, branch: string): Promise<GitHubBranch> {
    return this.client.get<GitHubBranch>(`repos/${owner}/${repo}/branches/${branch}`);
  }

  /**
   * 저장소 내용 조회 (파일 또는 디렉토리)
   */
  async getContent(owner: string, repo: string, path: string, ref?: string): Promise<GitHubContent | GitHubContent[]> {
    return this.client.get<GitHubContent | GitHubContent[]>(`repos/${owner}/${repo}/contents/${path}`, {
      params: { ref }
    });
  }

  /**
   * 파일 내용 생성 또는 업데이트
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
   * 파일 삭제
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
   * 저장소 토픽 조회
   */
  async getTopics(owner: string, repo: string): Promise<{ names: string[] }> {
    return this.client.get<{ names: string[] }>(`repos/${owner}/${repo}/topics`, {
      headers: {
        'Accept': 'application/vnd.github.mercy-preview+json'
      }
    });
  }

  /**
   * 저장소 토픽 설정
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
   * 저장소 언어 분포 조회
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.client.get<Record<string, number>>(`repos/${owner}/${repo}/languages`);
  }

  /**
   * 저장소 기여자 목록 조회
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