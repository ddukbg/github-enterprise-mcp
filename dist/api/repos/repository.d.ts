import { GitHubClient } from '../../utils/client.js';
import { GitHubRepository, GitHubBranch, GitHubContent, CreateRepoOptions, UpdateRepoOptions, GitHubUser } from './types.js';
/**
 * GitHub 저장소 관련 기능을 제공하는 클래스
 */
export declare class RepositoryAPI {
    private client;
    constructor(client: GitHubClient);
    /**
     * 사용자 또는 조직의 저장소 목록 조회
     */
    listRepositories(owner: string, type?: 'all' | 'owner' | 'member', sort?: 'created' | 'updated' | 'pushed' | 'full_name', page?: number, perPage?: number): Promise<GitHubRepository[]>;
    /**
     * 조직의 저장소 목록 조회
     */
    listOrganizationRepositories(org: string, type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member', sort?: 'created' | 'updated' | 'pushed' | 'full_name', page?: number, perPage?: number): Promise<GitHubRepository[]>;
    /**
     * 저장소 세부 정보 조회
     */
    getRepository(owner: string, repo: string): Promise<GitHubRepository>;
    /**
     * 새 저장소 생성 (사용자 계정)
     */
    createRepository(options: CreateRepoOptions): Promise<GitHubRepository>;
    /**
     * 새 저장소 생성 (조직)
     */
    createOrganizationRepository(org: string, options: CreateRepoOptions): Promise<GitHubRepository>;
    /**
     * 저장소 업데이트
     */
    updateRepository(owner: string, repo: string, options: UpdateRepoOptions): Promise<GitHubRepository>;
    /**
     * 저장소 삭제
     */
    deleteRepository(owner: string, repo: string): Promise<void>;
    /**
     * 저장소 브랜치 목록 조회
     */
    listBranches(owner: string, repo: string, protected_only?: boolean, page?: number, perPage?: number): Promise<GitHubBranch[]>;
    /**
     * 특정 브랜치 조회
     */
    getBranch(owner: string, repo: string, branch: string): Promise<GitHubBranch>;
    /**
     * 저장소 내용 조회 (파일 또는 디렉토리)
     */
    getContent(owner: string, repo: string, path: string, ref?: string): Promise<GitHubContent | GitHubContent[]>;
    /**
     * 파일 내용 생성 또는 업데이트
     */
    createOrUpdateFile(owner: string, repo: string, path: string, message: string, content: string, sha?: string, branch?: string): Promise<{
        content: GitHubContent | null;
        commit: {
            sha: string;
            html_url: string;
        };
    }>;
    /**
     * 파일 삭제
     */
    deleteFile(owner: string, repo: string, path: string, message: string, sha: string, branch?: string): Promise<{
        commit: {
            sha: string;
            html_url: string;
        };
    }>;
    /**
     * 저장소 토픽 조회
     */
    getTopics(owner: string, repo: string): Promise<{
        names: string[];
    }>;
    /**
     * 저장소 토픽 설정
     */
    replaceTopics(owner: string, repo: string, topics: string[]): Promise<{
        names: string[];
    }>;
    /**
     * 저장소 언어 분포 조회
     */
    getLanguages(owner: string, repo: string): Promise<Record<string, number>>;
    /**
     * 저장소 기여자 목록 조회
     */
    getContributors(owner: string, repo: string, anon?: boolean, page?: number, perPage?: number): Promise<Array<GitHubUser & {
        contributions: number;
    }>>;
}
