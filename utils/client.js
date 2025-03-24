import fetch from 'node-fetch';
import { buildApiUrl } from './config.js';
// HTTP 에러 클래스
export class GitHubError extends Error {
    status;
    data;
    constructor(message, status, data) {
        super(message);
        this.name = 'GitHubError';
        this.status = status;
        this.data = data;
    }
}
/**
 * GitHub API 요청을 수행하는 클라이언트
 */
export class GitHubClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * GitHub API 요청 수행
     */
    async request(path, options = {}) {
        const url = buildApiUrl(this.config, path);
        const method = options.method || 'GET';
        // URL 파라미터 처리
        const urlWithParams = this.addQueryParams(url, options.params);
        // 헤더 준비
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': this.config.userAgent,
            ...options.headers || {},
        };
        // 토큰이 있으면 인증 헤더 추가
        if (this.config.token) {
            headers['Authorization'] = `token ${this.config.token}`;
        }
        // 요청 바디 처리
        let body;
        if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            body = JSON.stringify(options.body);
            headers['Content-Type'] = 'application/json';
        }
        // 요청 디버그 로깅
        if (this.config.debug) {
            console.log(`[GitHub API] ${method} ${urlWithParams}`);
            console.log(`[GitHub API] 베이스 URL: ${this.config.baseUrl}`);
            if (body)
                console.log(`[GitHub API] Request body: ${body}`);
        }
        // AbortController 설정 (타임아웃용)
        const controller = new AbortController();
        const timeout = options.timeout || this.config.timeout;
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        // 요청 실행
        let response;
        try {
            response = await fetch(urlWithParams, {
                method,
                headers,
                body,
                signal: controller.signal
            });
            // 타임아웃 해제
            clearTimeout(timeoutId);
            // 응답 상태 확인
            if (!response.ok) {
                let errorData;
                let errorMessage = `GitHub API 오류: ${response.status} ${response.statusText}`;
                try {
                    // JSON 응답이면 파싱
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        errorData = await response.json();
                        if (errorData && errorData.message) {
                            errorMessage = `GitHub API 오류: ${errorData.message} (${response.status})`;
                        }
                    }
                }
                catch (e) {
                    // JSON 파싱 오류 무시
                }
                // 특정 오류 코드에 대한 사용자 친화적 메시지
                if (response.status === 401) {
                    errorMessage = 'GitHub API 인증 오류: 인증 토큰이 유효하지 않거나 만료되었습니다.';
                }
                else if (response.status === 403) {
                    errorMessage = 'GitHub API 접근 거부: 이 작업을 수행할 권한이 없습니다.';
                }
                else if (response.status === 404) {
                    errorMessage = `GitHub API 리소스를 찾을 수 없음: ${path}`;
                }
                else if (response.status === 422) {
                    errorMessage = 'GitHub API 검증 오류: 요청 데이터가 올바르지 않습니다.';
                }
                else if (response.status >= 500) {
                    errorMessage = 'GitHub API 서버 오류: 잠시 후 다시 시도하세요.';
                }
                throw new GitHubError(errorMessage, response.status, errorData);
            }
        }
        catch (error) {
            // 타임아웃 해제
            clearTimeout(timeoutId);
            // 타임아웃 오류 처리
            if (error.name === 'AbortError') {
                throw new GitHubError(`GitHub API 요청 타임아웃: 요청이 ${timeout}ms 내에 완료되지 않았습니다.`, 408);
            }
            // GitHubError는 그대로 다시 throw
            if (error instanceof GitHubError) {
                throw error;
            }
            // 기타 네트워크 오류
            throw new GitHubError(`GitHub API 네트워크 오류: ${error.message}`, 0);
        }
        // 응답 처리
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }
        else {
            data = await response.text();
        }
        // 성공 응답 반환
        return data;
    }
    /**
     * 요청 URL에 쿼리 파라미터 추가
     */
    addQueryParams(url, params) {
        if (!params)
            return url;
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        }
        const queryString = queryParams.toString();
        if (!queryString)
            return url;
        return url.includes('?')
            ? `${url}&${queryString}`
            : `${url}?${queryString}`;
    }
    /**
     * GET 요청 헬퍼
     */
    async get(path, options = {}) {
        return this.request(path, { ...options, method: 'GET' });
    }
    /**
     * POST 요청 헬퍼
     */
    async post(path, body, options = {}) {
        return this.request(path, { ...options, method: 'POST', body });
    }
    /**
     * PUT 요청 헬퍼
     */
    async put(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PUT', body });
    }
    /**
     * PATCH 요청 헬퍼
     */
    async patch(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PATCH', body });
    }
    /**
     * DELETE 요청 헬퍼
     */
    async delete(path, options = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }
}
