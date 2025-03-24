/**
 * GitHub 저장소 관련 기능을 제공하는 클래스
 */
export class RepositoryAPI {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * 사용자 또는 조직의 저장소 목록 조회
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
     * 조직의 저장소 목록 조회
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
     * 저장소 세부 정보 조회
     */
    async getRepository(owner, repo) {
        return this.client.get(`repos/${owner}/${repo}`);
    }
    /**
     * 새 저장소 생성 (사용자 계정)
     */
    async createRepository(options) {
        return this.client.post('user/repos', options);
    }
    /**
     * 새 저장소 생성 (조직)
     */
    async createOrganizationRepository(org, options) {
        return this.client.post(`orgs/${org}/repos`, options);
    }
    /**
     * 저장소 업데이트
     */
    async updateRepository(owner, repo, options) {
        return this.client.patch(`repos/${owner}/${repo}`, options);
    }
    /**
     * 저장소 삭제
     */
    async deleteRepository(owner, repo) {
        await this.client.delete(`repos/${owner}/${repo}`);
    }
    /**
     * 저장소 브랜치 목록 조회
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
     * 특정 브랜치 조회
     */
    async getBranch(owner, repo, branch) {
        return this.client.get(`repos/${owner}/${repo}/branches/${branch}`);
    }
    /**
     * 저장소 내용 조회 (파일 또는 디렉토리)
     */
    async getContent(owner, repo, path, ref) {
        return this.client.get(`repos/${owner}/${repo}/contents/${path}`, {
            params: { ref }
        });
    }
    /**
     * 파일 내용 생성 또는 업데이트
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
     * 파일 삭제
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
     * 저장소 토픽 조회
     */
    async getTopics(owner, repo) {
        return this.client.get(`repos/${owner}/${repo}/topics`, {
            headers: {
                'Accept': 'application/vnd.github.mercy-preview+json'
            }
        });
    }
    /**
     * 저장소 토픽 설정
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
     * 저장소 언어 분포 조회
     */
    async getLanguages(owner, repo) {
        return this.client.get(`repos/${owner}/${repo}/languages`);
    }
    /**
     * 저장소 기여자 목록 조회
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
