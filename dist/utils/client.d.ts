import { Config } from './config.js';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface RequestOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | null | undefined>;
    body?: any;
    timeout?: number;
    responseType?: 'json' | 'text' | 'arraybuffer' | 'blob' | 'document' | 'redirect';
}
export declare class GitHubError extends Error {
    status: number;
    data?: any;
    constructor(message: string, status: number, data?: any);
}
/**
 * Client for making GitHub API requests
 */
export declare class GitHubClient {
    private config;
    constructor(config: Config);
    /**
     * Perform GitHub API request
     */
    request<T = any>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Add query parameters to request URL
     */
    private addQueryParams;
    /**
     * GET request helper
     */
    get<T = any>(path: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /**
     * POST request helper
     */
    post<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * PUT request helper
     */
    put<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * PATCH request helper
     */
    patch<T = any>(path: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /**
     * DELETE request helper
     */
    delete<T = any>(path: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
}
