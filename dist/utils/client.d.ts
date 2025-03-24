import { Config } from './config.js';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface RequestOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | null | undefined>;
    body?: any;
    timeout?: number;
}
export declare class GitHubError extends Error {
    status: number;
    data?: any;
    constructor(message: string, status: number, data?: any);
}
/**
 * GitHub API 요청을 수행하는 클라이언트
 */
export declare class GitHubClient {
    private config;
    constructor(config: Config);
    /**
     * GitHub API 요청 수행
     */
    request<T = any>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * 요청 URL에 쿼리 파라미터 추가
     */
    private addQueryParams;
    /**
     * GET 요청 헬퍼
     */
    get<T = any>(path: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /**
     * POST 요청 헬퍼
     */
    post<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * PUT 요청 헬퍼
     */
    put<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * PATCH 요청 헬퍼
     */
    patch<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * DELETE 요청 헬퍼
     */
    delete<T = any>(path: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
}
